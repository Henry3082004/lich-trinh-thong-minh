import React, { forwardRef } from "react";
import { POSTER_MIN_HEIGHT, POSTER_WIDTH, posterFooterUrl, type PosterData } from "../poster-data";
import { FONT, subtitleOf, Thumb, titleSize } from "./shared";

// Mẫu "Tối giản": nền kem, chữ lớn, ảnh bìa bo góc, các ngày chia hai cột (1 ngày thì một cột)
const GREEN_DARK = "#1b4d20";
const GREEN = "#2e7d32";
const BROWN = "#6d4c41";

export const MinimalPoster = forwardRef<HTMLDivElement, { data: PosterData }>(({ data }, ref) => {
  const twoCols = data.days.length > 1;
  // Hai cột hẹp nên thu gọn thêm khi nhiều điểm; một cột thì có chỗ cho ảnh nhỏ
  const showThumb = !data.compact;

  return (
    <div
      ref={ref}
      style={{
        width: POSTER_WIDTH,
        minHeight: POSTER_MIN_HEIGHT,
        background: "#faf7f0",
        fontFamily: FONT,
        color: GREEN_DARK,
        padding: 72,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 600, color: BROWN, letterSpacing: 3, textTransform: "uppercase" }}>
        <div>Đắk Song</div>
        <div>{subtitleOf(data)}</div>
      </div>
      <div style={{ fontSize: titleSize(data.title, 96), fontWeight: 800, lineHeight: 1.06, letterSpacing: -2, marginTop: 40 }}>{data.title}</div>
      <div style={{ width: "100%", height: data.compact ? 420 : 560, marginTop: 48, borderRadius: 48, overflow: "hidden", background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN} 60%, #66bb6a)`, flexShrink: 0 }}>
        {data.heroPhoto && <img src={data.heroPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: twoCols ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: "56px 48px", marginTop: 64, alignItems: "start" }}>
        {data.days.map((d) => (
          <div key={d.day}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, paddingBottom: 18, borderBottom: `4px solid ${GREEN}` }}>
              <div style={{ fontSize: 44, fontWeight: 800 }}>Ngày {d.day}</div>
              <div style={{ fontSize: 24, color: BROWN, fontWeight: 500 }}>{d.totalLabel}</div>
            </div>
            {d.stops.length === 0 && <div style={{ fontSize: 28, color: BROWN, padding: "20px 0" }}>Tự do khám phá</div>}
            {d.stops.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 20, alignItems: "center", padding: "20px 0", borderBottom: "2px solid #e6e0d2" }}>
                {showThumb && <Thumb stop={s} size={96} radius={24} tint="#e6f2e6" />}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#43a047" }}>{s.time}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, color: "#1f2a1f" }}>{s.name}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 56, display: "flex", justifyContent: "space-between", fontSize: 26, color: BROWN }}>
        <div style={{ fontWeight: 700, color: GREEN }}>Lịch trình Đắk Song</div>
        <div>{posterFooterUrl()}</div>
      </div>
    </div>
  );
});
MinimalPoster.displayName = "MinimalPoster";
