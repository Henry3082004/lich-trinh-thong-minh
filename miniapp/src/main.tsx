import React from "react";
import { createRoot } from "react-dom/client";
import "zmp-ui/zaui.css";
import "./theme.css";
import MyApp from "./app";

// Lỗi ngoài React (promise bị từ chối, script lỗi) cũng hiện lên màn hình để dễ báo lỗi.
// zmp-sdk tự gọi login khi chạy ngoài Zalo và báo lỗi, đó là bình thường nên bỏ qua.
function showFatal(message: string) {
  if (document.getElementById("fatal-banner")) return;
  const el = document.createElement("div");
  el.id = "fatal-banner";
  el.style.cssText =
    "position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#b3261e;color:#fff;padding:10px 12px;border-radius:8px;font:12px sans-serif;white-space:pre-wrap";
  el.textContent = `Lỗi: ${message}`;
  el.onclick = () => el.remove();
  document.body.appendChild(el);
}

window.addEventListener("error", (e) => showFatal(e.message));
window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason as { api?: string; message?: string } | undefined;
  if (reason?.api === "login") return;
  // Zalo chưa kích hoạt đăng nhập cho Mini App: app vẫn chạy bằng mã khách, không cần báo
  if (/login failed|not been activated/i.test(reason?.message ?? "")) return;
  showFatal(reason?.message ?? JSON.stringify(reason));
});

createRoot(document.getElementById("app")!).render(<MyApp />);
