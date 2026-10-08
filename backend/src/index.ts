import { createApp } from "./app";
import { config } from "./config";
import { deleteExpiredPosters } from "./routes/posters";

createApp().listen(config.port, () => {
  console.log(`API đang chạy ở cổng ${config.port} (AUTH_MODE=${config.authMode})`);
});

// Dọn ảnh poster hết hạn khi khởi động rồi mỗi 6 giờ
const cleanup = () =>
  deleteExpiredPosters()
    .then((n) => n > 0 && console.log(`Đã xoá ${n} ảnh poster hết hạn`))
    .catch((err) => console.error("Dọn ảnh poster lỗi:", err));
void cleanup();
setInterval(cleanup, 6 * 60 * 60 * 1000).unref();
