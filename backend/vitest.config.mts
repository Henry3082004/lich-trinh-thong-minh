import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test API dùng database riêng, không đụng dữ liệu dev
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/daksong_test",
      AUTH_MODE: "dev",
    },
    fileParallelism: false,
  },
});
