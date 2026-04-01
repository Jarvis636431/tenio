## ADDED Requirements

### Requirement: ESLint SHALL run successfully

The project SHALL have a working ESLint configuration that passes without errors on all source files.

#### Scenario: ESLint executes without module errors

- **WHEN** running `pnpm lint`
- **THEN** ESLint executes without "Cannot find module" errors

#### Scenario: ESLint checks all TypeScript files

- **WHEN** ESLint runs
- **THEN** all `.ts` and `.tsx` files in `src/` are checked

### Requirement: no-unused-vars rule SHALL be enabled

The `@typescript-eslint/no-unused-vars` rule SHALL be enabled at `warn` level initially, allowing gradual cleanup.

#### Scenario: Unused variables produce warnings

- **WHEN** a TypeScript file contains an unused variable or import
- **THEN** ESLint outputs a warning for that line

#### Scenario: Warnings do not block CI

- **WHEN** ESLint runs in CI with warn-level violations
- **THEN** the CI job passes (warnings are non-blocking)

### Requirement: Prettier configuration SHALL be complete

Prettier SHALL have explicit settings for `tabWidth`, `endOfLine`, and `printWidth` to ensure consistent formatting across environments.

#### Scenario: Prettier formats with consistent indentation

- **WHEN** running `pnpm format`
- **THEN** all files use 2-space indentation as configured

#### Scenario: Line endings are normalized

- **WHEN** a file with CRLF line endings is formatted
- **THEN** it is converted to LF line endings

### Requirement: ESLint and Prettier SHALL not conflict

The `eslint-config-prettier` integration SHALL disable all ESLint rules that conflict with Prettier formatting.

#### Scenario: No conflicting style rules

- **WHEN** both ESLint and Prettier check the same file
- **THEN** they do not produce contradictory formatting suggestions
