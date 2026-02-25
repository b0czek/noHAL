import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  main: {
    build: {
      target: "node22",
      rollupOptions: {
        output: {
          format: "cjs",
          entryFileNames: "[name].cjs",
        },
      },
    },
    plugins: [
      externalizeDepsPlugin(),
      {
        name: "electron-main-preview-shim",
        apply: "build",
        generateBundle(_options, bundle) {
          const hasMainCjs = Object.keys(bundle).some(
            (name) => name === "index.cjs",
          );
          if (!hasMainCjs) return;
          this.emitFile({
            type: "asset",
            fileName: "index.js",
            source: 'import "./index.cjs";\n',
          });
        },
      },
    ],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: "cjs",
          entryFileNames: "[name].cjs",
        },
      },
    },
  },
  renderer: {
    plugins: [solid()],
  },
});
