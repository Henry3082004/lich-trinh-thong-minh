import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import zaloMiniApp from "zmp-vite-plugin";

// https://vitejs.dev/config/
export default () =>
  defineConfig({
    root: "./src",
    base: "",
    envDir: "..",
    plugins: [react(), zaloMiniApp()],
    build: {
      outDir: "../www",
      emptyOutDir: true,
      assetsInlineLimit: 0,
    },
  });
