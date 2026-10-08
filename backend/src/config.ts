export const config = {
  port: Number(process.env.PORT ?? 3000),
  // "zalo": xác thực token Zalo thật. "dev": chấp nhận header X-Dev-User để test.
  authMode: (process.env.AUTH_MODE ?? "zalo") as "zalo" | "dev",
  // Danh sách origin cho phép, cách nhau bởi dấu phẩy. "*" = cho phép tất cả.
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  // Máy chủ ảnh được phép lấy qua /api/img (chống SSRF), cách nhau bởi dấu phẩy
  imageHosts: (process.env.IMAGE_HOSTS ?? "static.dggv.edu.vn").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean),
  // Địa chỉ công khai của API, dùng để tạo link ảnh poster. Bỏ trống thì suy ra từ request.
  publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, ""),
  posterTtlDays: Number(process.env.POSTER_TTL_DAYS ?? 30),
  zaloGraphUrl: process.env.ZALO_GRAPH_URL ?? "https://graph.zalo.me/v2.0/me",
};
