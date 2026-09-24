# Design sync notes — Geo Pin Properties

Target: https://claude.ai/design/p/fe77b1b4-3fc7-48a7-86c1-a962477670fe

## How this repo is synced

- This is an **app**, not a published DS. `.design-sync/build.mjs` (the `buildCmd`) packages
  `src/components/ui/*` into a mini library at `.design-sync/.cache/pkg/`: esbuild ESM bundle
  (deps external), `tsc` declarations with `@/` aliases rewritten to relative paths, and a
  Tailwind v4 compile of `.design-sync/tailwind.css`. Run it before every `package-build.mjs`.
- `cfg.entry` points at that pkg; `srcDir`/`tsconfig` are relative to the pkg dir
  (`../../../…`) because the converter resolves config paths from PKG_DIR.
- Tooling (esbuild, ts-morph, playwright, `@tailwindcss/cli@<repo tailwind version>`) lives in
  `.ds-sync/node_modules` only — the app's lockfile is never touched. Install:
  `cd .ds-sync && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i esbuild ts-morph @types/react playwright @tailwindcss/cli@$(node -p "require('../node_modules/tailwindcss/package.json').version")`
- No playwright browser download: run validate/capture with `DS_CHROMIUM_PATH=/usr/bin/chromium`.
- Fork `.design-sync/overrides/source-kit.mjs` maps every shadcn compound export to its
  declaring file and groups by `UI_CATEGORY`. **Add new ui files to `UI_CATEGORY`** or they fall
  into `general`. Needs `ln -sfn ../.ds-sync/node_modules .design-sync/node_modules` per clone.
- Previews add Tailwind classes, so a preview change needs the **full** flow
  (`build.mjs` → `package-build.mjs`) whenever it uses a class not already in the CSS;
  `preview-rebuild.mjs` alone is fine for prop/content-only edits.

## Styling / CSS

- Tailwind is JIT, but the design agent writes new markup, so `.design-sync/tailwind.css`
  safelists token color utilities + layout scale via `@source inline(...)`. Keep it narrow: a
  first attempt crossing all states × colors × opacities produced a 5.1 MB stylesheet
  (now ~400 KB).
- Inter is loaded at runtime from Google Fonts (`@import` prepended to ds.css) — `[FONT_REMOTE]`.
- Brand: `--brand` = logo green #1A752A, `--primary` = logo navy #0A1C2E (set in
  `src/styles.css`, 2026-09-22). `Button` default variant is **navy**; green CTAs use
  `className="bg-brand text-brand-foreground hover:bg-brand/90"`.
- `.d.ts` inherited DOM props (onClick, disabled, type…) are filtered by `[DTS_STYLE_SYSTEM]`
  by design — all primitives forward native props; the conventions header says so.

## Preview authoring

- Radix overlays: render with `open` and set `cfg.overrides.<Name>` to
  `{"cardMode":"single","viewport":"WxH"}`. Add `onOpenAutoFocus={(e) => e.preventDefault()}`
  on the Content or the capture shows a text-selection highlight in the first input.

- `Slider` renders a single Thumb (src/components/ui/slider.tsx) — two-value ranges show one
  handle. Preview shows single-value only; conventions header warns the agent.

- `Toaster` stays a floor card: a preview's `toast()` imports its own copy of `sonner`, which
  never reaches the Toaster bundled in `_ds_bundle.js` (ui/sonner.tsx doesn't re-export
  `toast`). Re-exporting `toast` from sonner.tsx would make it authorable.
- `ContextMenu` can't be opened statically (Radix ContextMenu has no `open` prop) — preview
  shows the trigger area only.
- Components that mix a bundled wrapper with a preview-side library copy DO work when the
  link is plain props: `Form` (+ react-hook-form `useForm`), `ChartContainer` (+ recharts).

## Known render warns

- Sub-part floor cards (190) are the deliberate baseline, not failures.

## DS findings to raise with the team (not fixed by the sync)

- `--accent` doubles as the hover/open tint in shadcn primitives, so with accent = brand green,
  hover and open states are solid green (Select item, Command item, Menubar trigger, pressed
  Toggle) and NavigationMenu's open trigger is white-on-50%-green (weak contrast). This was
  already the case with the old blue accent.

## Re-sync risks

- **Brand tokens are app code.** `--brand/--accent/--ring/--primary` live in `src/styles.css`;
  any later retheme there changes every card — re-sync after it lands.
- **`UI_CATEGORY` in the source-kit fork is a hand list.** A new `src/components/ui/*.tsx` not
  added there lands in the `general` group.
- **Tailwind CLI version is pinned by hand** to the repo's `tailwindcss` version at install
  time (`.ds-sync` is regenerated). A repo Tailwind bump without reinstalling the CLI can change
  the compiled CSS subtly.
- **Inter is network-loaded** (Google Fonts `@import`); offline renders fall back to system sans.
- **Chromium**: validated with system `/usr/bin/chromium` via `DS_CHROMIUM_PATH`, not a
  Playwright-pinned build — a major Chromium upgrade may shift screenshots.
- `.design-sync/tailwind.css` safelist is a guess at what the design agent will write; if designs
  come back with unstyled utilities, widen it (watch the ~400 KB size).
- Floor-card sub-parts (190) and `Toaster` are unauthored — authorable on any re-sync.

## Re-sync recipe

```sh
S=<design-sync skill dir>; cp -r $S/{package-build,package-validate,package-capture,resync}.mjs $S/lib $S/storybook .ds-sync/
ln -sfn ../.ds-sync/node_modules .design-sync/node_modules
node .design-sync/build.mjs
# fetch _ds_sync.json from the project -> .design-sync/.cache/remote-sync.json, then:
DS_CHROMIUM_PATH=/usr/bin/chromium node .ds-sync/resync.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json
```
