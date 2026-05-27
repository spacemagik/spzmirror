import { defineConfig } from "vite";

// Cross-Origin Isolation headers are required by SharedArrayBuffer, which
// Spark's WASM sort worker needs. Without them the tool silently fails in
// the browser with a DataCloneError.
const crossOriginHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  // Use "./" so all asset paths in the built HTML are relative.
  // This lets the site work when deployed to a GitHub Pages subdirectory
  // (e.g. https://spacemagik.github.io/splat-mirror/) without any
  // extra configuration.
  base: "./",

  server: {
    headers: crossOriginHeaders,
  },
  preview: {
    headers: crossOriginHeaders,
  },

  // Treat .spz as a static asset (served as-is, not parsed by Vite)
  assetsInclude: ["**/*.spz"],
});
