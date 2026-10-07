import React, { forwardRef } from "react";
import type { Draft } from "../types";
import { categoryIcon } from "../types";

// Ảnh lịch trình để lưu về máy. Chỉ dùng chữ + màu (không nhúng ảnh từ domain khác)
// để html-to-image xuất được mà không dính lỗi CORS.
export const POSTER_WIDTH = 1080;

const styles = {
  root: {
    width: POSTER_WIDTH,
    background: "#faf7f0",
    fontFamily: '-apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    color: "#1f2a1f",
    paddingBottom: 56,
  },
  header: {
    background: "linear-gradient(160deg, #1b4d20, #2e7d32 65%, #43a047)",
    padding: "72px 64px 120px",
    borderRadius: "0 0 56px 56px",
  },
  body: { padding: "0 64px", marginTop: -72 },
  brand: { color: "#cfe8cf", fontSize: 30, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 },
  title: { color: "#fff", fontSize: 64, fontWeight: 800, margin: "16px 0 8px", lineHeight: 1.15 },
  subtitle: { color: "#e6f2e6", fontSize: 30 },
  day: {
    background: "#fff",
    borderRadius: 32,
    padding: "36px 40px",
    marginBottom: 32,
    boxShadow: "0 8px 30px rgba(27,77,32,0.12)",
  },
  dayTitle: { fontSize: 38, fontWeight: 800, color: "#2e7d32", marginBottom: 20 },
  stop: { display: "flex", alignItems: "center", gap: 24, padding: "14px 0", borderTop: "2px dashed #e2e6dd" },
  time: { fontSize: 32, fontWeight: 800, color: "#6d4c41", width: 110 },
  icon: { fontSize: 40, width: 56, textAlign: "center" },
  name: { fontSize: 34, fontWeight: 600, flex: 1 },
  footer: { textAlign: "center", color: "#667066", fontSize: 26, marginTop: 40 },
} satisfies Record<string, React.CSSProperties>;

export const ItineraryPoster = forwardRef<HTMLDivElement, { draft: Draft }>(({ draft }, ref) => (
  <div ref={ref} style={styles.root}>
    <div style={styles.header}>
      <div style={styles.brand}>Du lịch Đắk Song</div>
      <div style={styles.title}>{draft.title}</div>
      <div style={styles.subtitle}>
        {draft.schedule.length} ngày · {draft.schedule.reduce((n, d) => n + d.stops.length, 0)} điểm đến
      </div>
    </div>

    <div style={styles.body}>
      {draft.schedule.map((d) => (
        <div key={d.day} style={styles.day}>
          <div style={styles.dayTitle}>Ngày {d.day}</div>
          {d.stops.length === 0 && <div style={{ fontSize: 30, color: "#667066" }}>Tự do khám phá</div>}
          {d.stops.map((s, i) => (
            <div key={`${s.place.id}-${i}`} style={{ ...styles.stop, ...(i === 0 ? { borderTop: "none" } : {}) }}>
              <div style={styles.time}>{s.startTime}</div>
              <div style={styles.icon}>{categoryIcon(s.place.category)}</div>
              <div style={styles.name}>{s.place.name}</div>
            </div>
          ))}
        </div>
      ))}
    </div>

    <div style={styles.footer}>Tạo bằng Mini App Lịch trình Đắk Song trên Zalo</div>
  </div>
));
ItineraryPoster.displayName = "ItineraryPoster";
