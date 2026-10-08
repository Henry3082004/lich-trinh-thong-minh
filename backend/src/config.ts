export const config = {
  port: Number(process.env.PORT ?? 3000),
  // "zalo": xác thực token Zalo thật. "dev": chấp nhận header X-Dev-User để test.
  authMode: (process.env.AUTH_MODE ?? "zalo") as "zalo" | "dev",
  // Danh sách origin cho phép, cách nhau bởi dấu phẩy. "*" = cho phép tất cả.
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  zaloGraphUrl: process.env.ZALO_GRAPH_URL ?? "https://graph.zalo.me/v2.0/me",
};
