import { parseProjectDocumentBlocks, type ProjectDocumentBlock } from "@/lib/project-document";
import type { DocumentArtifact } from "../types";

interface UseProjectExportOptions {
  projectName?: string;
}

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function normalizeFileName(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "apm-project";
  return trimmed.replace(/[\\/:*?"<>|]/g, "_");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createTextRun(text: string, options: { bold?: boolean } = {}) {
  const preserveSpace = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : "";
  return `<w:r>${options.bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t${preserveSpace}>${escapeXml(text)}</w:t></w:r>`;
}

function createParagraph(text: string, style?: string) {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${styleXml}${createTextRun(text)}</w:p>`;
}

function createListItem(text: string) {
  return `<w:p><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>${createTextRun("• ")}${createTextRun(text)}</w:p>`;
}

function createTable(rows: string[][]) {
  const tableRows = rows
    .map(
      (row, rowIndex) =>
        `<w:tr>${row
          .map(
            (cell) =>
              `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/>${
                rowIndex === 0 ? '<w:shd w:fill="E5EDF7"/>' : ""
              }</w:tcPr>${createParagraph(cell, rowIndex === 0 ? "TableHeader" : undefined)}</w:tc>`,
          )
          .join("")}</w:tr>`,
    )
    .join("");

  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="9CA3AF"/><w:left w:val="single" w:sz="4" w:color="9CA3AF"/><w:bottom w:val="single" w:sz="4" w:color="9CA3AF"/><w:right w:val="single" w:sz="4" w:color="9CA3AF"/><w:insideH w:val="single" w:sz="4" w:color="9CA3AF"/><w:insideV w:val="single" w:sz="4" w:color="9CA3AF"/></w:tblBorders></w:tblPr>${tableRows}</w:tbl>`;
}

function buildDocumentXml(title: string, content: string, artifact?: DocumentArtifact) {
  const tocItems = artifact?.toc_items ?? [];
  const blocks = parseProjectDocumentBlocks(content);
  const body = [
    createParagraph(title, "Title"),
    tocItems.length > 0 ? createParagraph("目录", "Heading1") : "",
    ...tocItems.map((item) => createParagraph(item.title, "TocItem")),
    ...blocks.map((block: ProjectDocumentBlock) => {
      if (block.type === "heading") return createParagraph(block.text, `Heading${block.level}`);
      if (block.type === "listItem") return createListItem(block.text);
      if (block.type === "table") return createTable(block.rows);
      return createParagraph(block.text);
    }),
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Microsoft YaHei" w:eastAsia="Microsoft YaHei" w:hAnsi="Microsoft YaHei"/><w:sz w:val="21"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:jc w:val="center"/><w:spacing w:after="360"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="360" w:after="180"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="280" w:after="160"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="220" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="180" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TocItem"><w:name w:val="TOC Item"/><w:pPr><w:ind w:left="420"/></w:pPr><w:rPr><w:color w:val="4B5563"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table Header"/><w:rPr><w:b/></w:rPr></w:style>
</w:styles>`;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function uint32(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

function createZip(entries: Array<{ path: string; content: string }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const name = encoder.encode(entry.path);
    const data = encoder.encode(entry.content);
    const crc = crc32(data);
    const localHeader = new Uint8Array([
      ...uint32(0x04034b50),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(name.length),
      ...uint16(0),
    ]);
    localParts.push(localHeader, name, data);

    const centralHeader = new Uint8Array([
      ...uint32(0x02014b50),
      ...uint16(20),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(name.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(offset),
    ]);
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + data.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const endHeader = new Uint8Array([
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(entries.length),
    ...uint16(entries.length),
    ...uint32(centralDirectory.length),
    ...uint32(offset),
    ...uint16(0),
  ]);

  return concatBytes([...localParts, centralDirectory, endHeader]);
}

function buildDocxBlob(title: string, content: string, artifact?: DocumentArtifact) {
  const now = new Date().toISOString();
  const bytes = createZip([
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    },
    {
      path: "word/_rels/document.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { path: "word/document.xml", content: buildDocumentXml(title, content, artifact) },
    { path: "word/styles.xml", content: buildStylesXml() },
    {
      path: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeXml(title)}</dc:title><dc:creator>A.PM</dc:creator><cp:lastModifiedBy>A.PM</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`,
    },
    {
      path: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>A.PM</Application></Properties>`,
    },
  ]);
  return new Blob([bytes], { type: DOCX_MIME_TYPE });
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * 提供项目工作台导出动作。
 *
 * @param documentArtifact - 当前项目的施工组织设计文档产物
 * @param options - 导出配置
 * @returns 导出动作和按钮状态
 */
export function useProjectExport(
  documentArtifact?: DocumentArtifact,
  options: UseProjectExportOptions = {},
) {
  const canExport = Boolean(documentArtifact?.content_markdown.trim());

  const handleExport = () => {
    if (!documentArtifact?.content_markdown.trim()) return;

    const baseName = normalizeFileName(options.projectName);
    const version = documentArtifact.version ? `-v${documentArtifact.version}` : "";
    const fileName = `${baseName}-施工组织设计${version}.docx`;
    const title = documentArtifact.document_title || `${options.projectName ?? "项目"}施工组织设计`;

    downloadBlob(
      fileName,
      buildDocxBlob(title, documentArtifact.content_markdown, documentArtifact),
    );
  };

  return { canExport, handleExport };
}
