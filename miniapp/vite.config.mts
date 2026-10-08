import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import zaloMiniApp from "zmp-vite-plugin";

// BUILD_TARGET=web: bản demo chạy trên trình duyệt (Railway). Bỏ plugin Zalo vì plugin
// ép đường dẫn tương đối, làm hỏng việc tải lại trang ở các route con.
const isWeb = process.env.BUILD_TARGET === "web";

// https://vitejs.dev/config/
export default () =>
  defineConfig({
    root: "./src",
    base: isWeb ? "/" : "",
    envDir: "..",
    define: { __WEB_DEMO__: JSON.stringify(isWeb) },
    plugins: isWeb ? [react()] : [react(), zaloMiniApp()],
    build: {
      outDir: "../www",
      emptyOutDir: true,
      assetsInlineLimit: 0,
    },
  });
