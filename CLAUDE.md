# Claude Instructions — LandVerify Kenya

## Commit messages

- **Never** add a `Co-Authored-By:` trailer to git commit messages.

## What to change

- Only modify files that are directly relevant to the task at hand.
- Do not touch code in files that were not mentioned or are not required to complete the task.
- Do not refactor, rename, or clean up surrounding code while making a targeted fix.
- Do not add abstractions, helpers, or utilities that the task does not require.

## Code quality

- Write clean, minimal code. Add only what is needed — nothing more.
- Do not add comments unless the reason behind the code is genuinely non-obvious to a future reader. Never add comments that describe what the code does (the code already does that).
- Do not add error handling, fallbacks, or defensive checks for scenarios that cannot actually happen.
- Follow the patterns already established in the file you are editing. Match the existing style, naming, and structure.
- All code must be industry-standard and production-ready.

## Formatting and CI

Every pull request runs Prettier, ESLint, and TypeScript checks. Code that fails these will block the PR.

- After editing any `.ts`, `.tsx`, or `.md` file in a frontend repo, run `npx prettier --write <file>` before committing.
- To format everything at once: `npx prettier --write .`
- Never commit a file that Prettier would reformat — CI will fail.
- TypeScript must compile cleanly with `npx tsc --noEmit`. Fix type errors; do not use `any` to bypass them.
- ESLint must pass with `npm run lint`. Do not disable lint rules inline unless there is a documented reason.

## Tests

- New code must not break existing tests.
- When writing tests, follow the patterns in `src/test/` (frontend) or `tests/Feature/` (backend).
- All imports used in test files must be explicitly listed in the import statement — do not rely on globals.
- Frontend tests use Vitest + React Testing Library. Mock only what you must (external modules, auth context, router). Do not mock internal logic being tested.
- Backend tests use PHPUnit with `RefreshDatabase`. Assert outcomes via the database or response body — do not re-use revoked tokens within the same test (Sanctum guard caches the user).
- Tests must pass `npm test` (frontend) and `C:\xampp\php\php.exe artisan test` (backend) before committing.

## General philosophy

Extend the backend without increasing accidental complexity. Favor changes that leave the repo easier to understand and safer for the next engineer or agent.

## Backend (Laravel)

- Always use `C:\xampp\php\php.exe` for artisan commands — never the system `php` binary (Herd 8.3 is missing DLLs).
- Do not pass `--env=testing` to `artisan test` — the `phpunit.xml` env tags handle the database connection.
- PHPStan runs at level 5. New code must not introduce PHPStan errors. Do not add errors to the baseline unless explicitly asked.

## Frontend (React / TypeScript)

- Both `web-frontend` and `admin-web-frontend-` use TanStack Router with file-based routes.
- The `@/` path alias maps to `src/`. Use it consistently — do not use relative `../` paths when `@/` works.
- Do not install new dependencies without being asked. Prefer what is already in `package.json`.
- Node version in CI is 24. Do not downgrade it.
