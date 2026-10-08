import React from "react";

// Máy tính bảng/điện thoại không có DevTools: hiện lỗi lên màn hình thay vì trắng trang
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        <h3 style={{ color: "#b3261e", marginTop: 0 }}>Ứng dụng gặp lỗi</h3>
        <p>Bạn chụp màn hình này gửi người phát triển nhé.</p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#f6f0ec", padding: 12, borderRadius: 8, fontSize: 12 }}>
          {error.message}
          {"\n"}
          {(error.stack ?? "").split("\n").slice(0, 6).join("\n")}
        </pre>
        <button
          style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#2e7d32", color: "#fff" }}
          onClick={() => {
            try {
              localStorage.removeItem("draft-itinerary");
            } catch {
              // bỏ qua
            }
            window.location.href = "/";
          }}
        >
          Xoá lịch đang chỉnh và tải lại
        </button>
      </div>
    );
  }
}
