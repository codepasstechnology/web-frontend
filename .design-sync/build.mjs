// Packages src/components/ui as a library the design-sync converter can consume.
//
// This repo is an app, not a published design system, so there's no dist/.
// We produce one under .design-sync/.cache/pkg/:
//   index.mjs  - esbuild ESM bundle of every ui primitive (deps left external)
//   types/     - tsc declarations, with `@/` aliases rewritten to relative paths
//                so ts-morph can follow them without the repo's tsconfig
//   ds.css     - Tailwind v4 compiled from .design-sync/tailwind.css
//
// Tooling comes from the isolated .ds-sync/ deps; the app's lockfile is untouched.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bin = (n) => join(root, ".ds-sync/node_modules/.bin", n);
const out = join(root, ".design-sync/.cache/pkg");
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: "inherit" });

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const uiDir = join(root, "src/components/ui");
const modules = readdirSync(uiDir)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => f.replace(/\.tsx$/, ""))
  .sort();
const entry = join(out, "entry.ts");
writeFileSync(entry, modules.map((m) => `export * from "@/components/ui/${m}";\n`).join(""));

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const external = Object.keys(pkg.dependencies ?? {}).flatMap((d) => [d, `${d}/*`]);
run(bin("esbuild"), [
  entry,
  "--bundle",
  "--format=esm",
  "--jsx=automatic",
  `--tsconfig=${join(root, "tsconfig.json")}`,
  `--outfile=${join(out, "index.mjs")}`,
  ...external.map((e) => `--external:${e}`),
  "--log-level=warning",
]);

const tsconfig = join(out, "tsconfig.json");
writeFileSync(
  tsconfig,
  JSON.stringify({
    extends: join(root, "tsconfig.json"),
    include: [entry],
    compilerOptions: {
      noEmit: false,
      declaration: true,
      emitDeclarationOnly: true,
      rootDir: root,
      outDir: join(out, "types"),
      types: [],
      paths: { "@/*": [join(root, "src/*")] },
    },
  }),
);
run(join(root, "node_modules/.bin/tsc"), ["-p", tsconfig]);

const typesDir = join(out, "types");
const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const srcTypes = join(typesDir, "src");
for (const f of walk(typesDir).filter((p) => p.endsWith(".d.ts"))) {
  const text = readFileSync(f, "utf8").replace(/(["'])@\/([^"']+)\1/g, (_, q, p) => {
    let rel = relative(dirname(f), join(srcTypes, p)).split("\\").join("/");
    if (!rel.startsWith(".")) rel = `./${rel}`;
    return `${q}${rel}${q}`;
  });
  writeFileSync(f, text);
}

writeFileSync(
  join(out, "package.json"),
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version ?? "0.0.0",
      type: "module",
      module: "index.mjs",
      types: relative(out, join(typesDir, ".design-sync/.cache/pkg/entry.d.ts")),
      sideEffects: false,
    },
    null,
    2,
  ),
);

run(bin("tailwindcss"), [
  "-i",
  join(root, ".design-sync/tailwind.css"),
  "-o",
  join(out, "ds.body.css"),
  "--minify",
]);
writeFileSync(
  join(out, "ds.css"),
  '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");\n' +
    readFileSync(join(out, "ds.body.css"), "utf8"),
);
rmSync(join(out, "ds.body.css"));
console.log(`built ${modules.length} ui modules -> ${relative(root, out)}`);
