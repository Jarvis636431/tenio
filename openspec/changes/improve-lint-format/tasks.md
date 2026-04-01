## 1. Fix ESLint Dependencies

- [x] 1.1 Reinstall dependencies to resolve missing `eslint-config-prettier`
- [x] 1.2 Verify `pnpm lint` runs without module errors

## 2. Update ESLint Rules

- [x] 2.1 Enable `@typescript-eslint/no-unused-vars` as `warn` level
- [x] 2.2 Run lint and assess number of warnings generated
- [x] 2.3 Fix or suppress warnings in critical files (services, stores, hooks)

## 3. Update Prettier Configuration

- [x] 3.1 Add `tabWidth: 2` and `endOfLine: "lf"` to `.prettierrc.json`
- [x] 3.2 Run `pnpm format` and verify no unexpected changes

## 4. Set Up Git Hooks

- [x] 4.1 Install `husky` and `lint-staged` as devDependencies
- [x] 4.2 Run `husky init` to create `.husky/` directory
- [x] 4.3 Create `.husky/pre-commit` hook running `lint-staged`
- [x] 4.4 Add `lint-staged` config to `package.json` for `.ts/.tsx` files
- [x] 4.5 Add `prepare` script to `package.json` for auto-setup
- [x] 4.6 Test hook by making a commit with lint violations

## 5. Fix CI Workflow

- [x] 5.1 Update `.github/workflows/ci.yml` Node version from 20 to 22
- [x] 5.2 Verify CI workflow YAML is valid

## 6. Verification

- [x] 6.1 Run `pnpm check` (lint + typecheck + test + build) locally
- [x] 6.2 Verify pre-commit hook triggers on commit
- [ ] 6.3 Commit and push, verify CI passes
