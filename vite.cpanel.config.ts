import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

function cpanelPostBuild(outDir: string): Plugin {
  return {
    name: "cpanel-post-build",
    apply: "build",
    writeBundle() {
      const root = path.resolve(outDir);

      // Rename index.cpanel.html → index.html
      const htmlSrc = path.join(root, "index.cpanel.html");
      const htmlDest = path.join(root, "index.html");
      if (fs.existsSync(htmlSrc)) fs.renameSync(htmlSrc, htmlDest);

      // Copy .htaccess (Vite skips dotfiles in publicDir on some platforms)
      const htSrc = path.resolve("public-cpanel/.htaccess");
      const htDest = path.join(root, ".htaccess");
      if (fs.existsSync(htSrc)) fs.copyFileSync(htSrc, htDest);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const outDir = "dist-cpanel";
  return {
    plugins: [
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
      cpanelPostBuild(outDir),
    ],
    publicDir: false,
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: "index.cpanel.html",
      },
    },
    define: {
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL ?? ""),
    },
  };
});
