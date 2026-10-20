# Main-branch user journey

The backend and marketplace main deployment workflows call CI before deploying. CI now runs the user journey on main and on pull requests targeting main. Failure blocks deployment. The same workflow can be started manually from Actions.

The journey uses a built marketplace, a real Laravel API and a disposable SQLite database. It covers browser signup, email verification, login, the listing wizard, ID/deed uploads, document access checks, approval through the admin API, and publication. Email is captured locally; no real recipients are contacted. Admin console browser interaction and payments are outside this suite.

## GitHub setup

Set the repository secret `E2E_REPO_TOKEN` in **both** repositories to a token with read access to `codepasstechnology/web-frontend` and `codepasstechnology/backend`. No payment secrets are needed. The token is used only for checkout and is not persisted in Git configuration.

Merge the marketplace E2E files before enabling the backend workflow, because backend runs load the tests from marketplace `main`. Each run tests the caller repository's exact commit against the other repository's `main`. Coordinated changes across repositories need compatible rollout order.

Failures retain Playwright screenshots, traces and the HTML report for seven days. The workflows do not target the production application or use its database.

## Local run

Use a separate SQLite file named `e2e.sqlite`, a separate storage directory, `APP_ENV=testing`, `DB_CONNECTION=sqlite`, and an application key generated for testing. Set `E2E_BACKEND_DIR` to the backend checkout and set `E2E_STORAGE_DIR` and `LARAVEL_STORAGE_PATH` to the test storage directory. Create its `logs`, `framework/views`, `framework/sessions` and `framework/cache/data` directories first. Set `QUEUE_CONNECTION=sync`, `MAIL_MAILER=log`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `APP_URL=http://127.0.0.1:8000`, and `FRONTEND_URL=http://localhost:4173`.

1. Run `php e2e/support/prepare-backend.php` from the marketplace directory. It checks the effective Laravel configuration before migrating or seeding and refuses databases outside the test configuration. Do not run generic migration or seed commands against your ordinary local environment for this suite.
2. Start the API with `php -d display_errors=0 -S 127.0.0.1:8000 e2e/support/backend-router.php` in a separate terminal with the same test environment. The router checks the effective database configuration before handling requests and blocks unexpected outbound HTTP calls. The only suppressed application job is external map amenity lookup.
3. Build with `VITE_API_URL=http://127.0.0.1:8000/api` and `npm run build:cpanel`.
4. Run `npx playwright test --config playwright.journey.config.ts`. Playwright starts and stops a separate preview server on port 4173. It does not reuse a developer server on port 5173.

Use `C:\xampp\php\php.exe` for PHP commands in the local Windows environment. Do not reuse a seeded test database for another setup run; create a fresh test database instead.
