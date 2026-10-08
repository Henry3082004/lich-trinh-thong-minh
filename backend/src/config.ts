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
  // Khoá Google Places API (đặt trong biến môi trường, không đưa vào repo). Bỏ trống thì tắt phần đánh giá Google.
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  // Khoá Gemini API (Google AI Studio) cho chatbot hỏi đáp. Bỏ trống thì tắt chatbot.
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  // Đổi được bằng biến môi trường nếu Google đổi tên/ngừng model
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  // Model dự phòng khi model chính quá tải (503/429/500)
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL ?? "gemini-flash-lite-latest",
  planPerHour: Number(process.env.PLAN_PER_HOUR ?? 30),
  chatPerHour: Number(process.env.CHAT_PER_HOUR ?? 40),
  zaloGraphUrl: process.env.ZALO_GRAPH_URL ?? "https://graph.zalo.me/v2.0/me",
};
