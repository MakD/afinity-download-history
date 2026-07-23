import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { kvDataAdapter } from "@vinext/cloudflare/cache/kv-data-adapter";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedDir = path.resolve(__dirname, "../shared");
const ghDataDir = path.resolve(__dirname, "../gh/data");

export default defineConfig({
  plugins: [
    vinext({
      cache: { data: kvDataAdapter(), cdn: cdnAdapter() },
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare(),
  ],
  resolve: {
    alias: {
      "@shared": sharedDir,
      "@gh-data": ghDataDir,
      store: path.resolve(__dirname, "store"),
      helpers: path.resolve(__dirname, "helpers"),
    },
  },
  assetsInclude: ["**/*.ttf"],
  optimizeDeps: {
    include: ["lodash", "d3-scale", "d3-selection", "d3-shape", "d3-axis", "linkedom"],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
  legacy: {
    inconsistentCjsInterop: true,
  },
  ssr: {
    noExternal: ["linkedom", "@cf-wasm/og", "svgo"],
  },
});
