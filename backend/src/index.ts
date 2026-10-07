import { createApp } from "./app";
import { config } from "./config";

createApp().listen(config.port, () => {
  console.log(`API đang chạy ở cổng ${config.port} (AUTH_MODE=${config.authMode})`);
});
