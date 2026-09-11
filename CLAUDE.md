# Claude Instructions — LandVerify Kenya (web-frontend)

The public marketplace app. The admin console lives in `../admin-web-frontend-`
and the API in `../backend`, each with their own CLAUDE.md.

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

## React / TypeScript

- TanStack Router with file-based routes.
- The `@/` path alias maps to `src/`. Use it consistently — do not use relative `../` paths when `@/` works.
- Do not install new dependencies without being asked. Prefer what is already in `package.json`.
- Node version in CI is 24. Do not downgrade it.
- Data fetching goes through TanStack Query hooks in `src/lib/` (see `plans.ts`, `properties.ts`, `settings.ts`). Do not thread new server state through `AuthProvider`.
- Any route that renders a Leaflet map must set `ssr: false` — leaflet touches `window` at import time.

## Responsive tables

**Every table must have a defined mobile treatment.** A desktop table rendered at
phone width either overflows horizontally or wraps into unreadable rows.

For a **record list** — one row is one entity — render a table on desktop and
cards on mobile. `md` is the breakpoint:

```tsx
<>
  {/* Desktop */}
  <div className="hidden max-h-[70vh] overflow-auto md:block">
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10 bg-muted text-left text-[11px] uppercase tracking-wide text-muted-foreground">
        {/* … */}
      </thead>
    </table>
  </div>

  {/* Mobile */}
  <ul className="divide-y divide-border md:hidden">
    {rows.map((r) => (
      <li key={r.id}>
        <button
          onClick={() => open(r)}
          className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-muted/50"
        >
          {/* identity: thumbnail · title · secondary id · headline value */}
          {/* status chips */}
          {/* footer: context left, action affordance right */}
        </button>
      </li>
    ))}
  </ul>
</>
```

Rules:

- A card shows **identity, one headline value, status, and one line of context** — not every column. Detail belongs in a modal or a detail view, otherwise the card duplicates it and the list stops being scannable.
- The whole card is the tap target, not a small link inside it.
- A KPI/stat row above a table uses `grid-cols-3` (or `grid-cols-2`) on mobile, never one per row. Stacked stat cards pushed the first listing on the admin Properties page to 690px before this rule existed.
- **Matrix tables are the exception.** When rows and columns are both data (a permissions grid, a comparison matrix), keep one table and give it `overflow-x-auto` with a sticky first column. One card per row would just relocate the problem.

The reference implementation is `PropertiesTab` in `../admin-web-frontend-/src/routes/admin.tsx`.

## Formatting and CI

Every pull request runs Prettier, ESLint, and TypeScript checks. Code that fails these will block the PR.

- After editing any `.ts`, `.tsx`, or `.md` file, run `npx prettier --write <file>` before committing.
- TypeScript must compile cleanly with `npx tsc --noEmit`. Fix type errors; do not use `any` to bypass them.
- ESLint must pass. **Lint the changed files directly — `npx eslint src/lib/foo.ts` — not `eslint .`**: the whole-tree run walks vendored directories outside `src/` and takes over 15 minutes locally. Do not disable lint rules inline unless there is a documented reason.

## Tests

- New code must not break existing tests.
- Follow the patterns in `src/test/`.
- Vitest + React Testing Library. The glob is `src/test/**/*.test.{ts,tsx}`, so a pure-logic test can be a plain `.ts` file.
- All imports used in test files must be explicitly listed — do not rely on globals.
- Mock only what you must (external modules, auth context, router). Do not mock internal logic being tested.
- jsdom has no media queries, so both the table and the card list render. Assert that each exists and is gated to the right breakpoint rather than trying to assert visibility.
- Tests must pass `npm test` before committing.

## General philosophy

Extend the app without increasing accidental complexity. Favor changes that leave the repo easier to understand and safer for the next engineer or agent.
