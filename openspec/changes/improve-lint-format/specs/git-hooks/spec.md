## ADDED Requirements

### Requirement: pre-commit hook SHALL run lint and format

A pre-commit Git hook SHALL automatically run ESLint and Prettier on staged files before each commit.

#### Scenario: Staged TypeScript files are linted

- **WHEN** a developer runs `git commit` with staged `.ts` or `.tsx` files
- **THEN** ESLint runs with `--fix` on those files before the commit completes

#### Scenario: Staged files are formatted

- **WHEN** a developer runs `git commit` with staged files
- **THEN** Prettier formats those files before the commit completes

#### Scenario: Lint failures block the commit

- **WHEN** ESLint finds errors that cannot be auto-fixed
- **THEN** the commit is aborted and error details are displayed

### Requirement: lint-staged SHALL only check changed files

lint-staged SHALL only process files that are staged for commit, not the entire codebase.

#### Scenario: Only staged files are processed

- **WHEN** committing 3 modified files out of 100
- **THEN** only those 3 files are linted and formatted

#### Scenario: Non-source files are skipped

- **WHEN** committing `.md` or `.json` files
- **THEN** ESLint does not run on those files (only Prettier if configured)

### Requirement: husky SHALL be auto-installed after dependency install

Running `pnpm install` SHALL automatically set up husky Git hooks via the `prepare` script.

#### Scenario: Fresh clone has hooks ready

- **WHEN** a developer clones the repo and runs `pnpm install`
- **THEN** Git hooks are automatically configured

#### Scenario: Hooks are committed to version control

- **WHEN** the repository is cloned
- **THEN** the `.husky/` directory exists and is tracked by Git
