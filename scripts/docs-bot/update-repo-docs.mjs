import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const targetFiles = ["README.md", "AGENTS.md", "CLAUDE.md"];
const contextFiles = [
  "package.json",
  "pnpm-workspace.yaml",
  ".nvmrc",
  ".github/workflows/monorepo-ci-cd.yml",
  "docs/deployment.md",
  "docs/api-contract.md",
  "apps/web/package.json",
  "apps/api/package.json",
  "packages/shared/package.json",
  "apps/web/vite.config.ts",
  "apps/web/eslint.config.js",
  "apps/api/eslint.config.js",
  "apps/api/prisma/schema.prisma",
];

const apiKey = process.env.DOCS_BOT_API_KEY || process.env.OPENAI_API_KEY;
const apiBase = (process.env.DOCS_BOT_API_BASE || "https://api.openai.com/v1").replace(/\/$/, "");
const model = process.env.DOCS_BOT_MODEL;

if (!apiKey) {
  throw new Error("Missing DOCS_BOT_API_KEY or OPENAI_API_KEY.");
}

if (!model) {
  throw new Error("Missing DOCS_BOT_MODEL GitHub variable.");
}

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function readIfExists(filePath, maxChars = 24000) {
  const absolutePath = path.join(repoRoot, filePath);

  if (!existsSync(absolutePath)) {
    return null;
  }

  const content = readFileSync(absolutePath, "utf8");
  return content.length > maxChars ? `${content.slice(0, maxChars)}\n\n[TRUNCATED]\n` : content;
}

function listFiles() {
  return runGit(["ls-files"])
    .split("\n")
    .filter(Boolean)
    .filter((file) => {
      if (file.startsWith("node_modules/")) return false;
      if (file.startsWith("apps/web/dist/")) return false;
      if (file.startsWith("dist/")) return false;
      return true;
    })
    .slice(0, 800)
    .join("\n");
}

function changedFiles() {
  const before = process.env.GITHUB_EVENT_BEFORE;
  const after = process.env.GITHUB_SHA || "HEAD";

  if (before && !/^0+$/.test(before)) {
    const diff = runGit(["diff", "--name-only", before, after]);
    if (diff) return diff;
  }

  return runGit(["show", "--name-only", "--pretty=format:", after]);
}

const currentDocs = Object.fromEntries(
  targetFiles.map((file) => [file, readIfExists(file, 50000) ?? ""]),
);

const repositoryContext = Object.fromEntries(
  contextFiles.map((file) => [file, readIfExists(file)]).filter(([, content]) => content !== null),
);

const messages = [
  {
    role: "system",
    content: [
      "You are a repository documentation maintenance bot.",
      "Update only README.md, AGENTS.md, and CLAUDE.md.",
      "Keep the documents accurate, concise, and aligned with the repository state.",
      "Do not invent commands, files, APIs, or architecture.",
      "Preserve the existing language mix and tone of each document.",
      "Return strict JSON only. The JSON object must have exactly these keys: README.md, AGENTS.md, CLAUDE.md.",
      "Each value must be the complete updated Markdown content for that file.",
    ].join(" "),
  },
  {
    role: "user",
    content: JSON.stringify(
      {
        task: "Refresh repository docs after a push to main.",
        changedFiles: changedFiles(),
        trackedFiles: listFiles(),
        currentDocs,
        repositoryContext,
      },
      null,
      2,
    ),
  },
];

const response = await fetch(`${apiBase}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  }),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`LLM request failed: ${response.status} ${response.statusText}\n${body}`);
}

const payload = await response.json();
const content = payload.choices?.[0]?.message?.content;

if (!content) {
  throw new Error("LLM response did not include message content.");
}

let updatedDocs;

try {
  updatedDocs = JSON.parse(content);
} catch (error) {
  throw new Error(`LLM response was not valid JSON: ${error.message}\n${content}`);
}

const keys = Object.keys(updatedDocs).sort();
const expectedKeys = [...targetFiles].sort();

if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
  throw new Error(
    `LLM response keys must be exactly ${expectedKeys.join(", ")}. Got: ${keys.join(", ")}`,
  );
}

for (const file of targetFiles) {
  const nextContent = updatedDocs[file];

  if (typeof nextContent !== "string" || nextContent.trim().length === 0) {
    throw new Error(`LLM response for ${file} must be a non-empty string.`);
  }

  writeFileSync(path.join(repoRoot, file), `${nextContent.replace(/\s+$/u, "")}\n`, "utf8");
}
