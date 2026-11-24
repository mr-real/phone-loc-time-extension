import { defineConfig } from "vitest/config";

export default defineConfig({
  // Everything in public/ (our manifest.json) is copied into dist/ as-is.
  publicDir: "public",
  define: {
    // Library mode does not replace this; some libraries reference it.
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  test: { include: ["test/**/*.test.ts"] },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "chrome110",
    minify: true,
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: "src/content.ts",
      formats: ["iife"],          // content scripts cannot be ES modules
      name: "TelLocalTime",       // required by iife format, otherwise unused
      fileName: () => "content.js",
    },
  },
});
