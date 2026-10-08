import React, { forwardRef } from "react";
import { POSTER_MIN_HEIGHT, POSTER_WIDTH, posterFooterUrl, type PosterData } from "../poster-data";
import { FONT, heroHeight, rowHeight, Thumb, titleSize, travelText } from "./shared";

// Mẫu "Rừng xanh": xanh lá + kem, ảnh bìa lớn, thẻ trắng bo tròn cho từng ngày
const GREEN_DARK = "#1b4d20";
const GREEN = "#2e7d32";
const CREAM = "#f4f0e6";
const BROWN = "#6d4c41";

export const ForestPoster = forwardRef<HTMLDivElement, { data: PosterData }>(({ data }, ref) => {
  const hero = heroHeight(data, { header: 0, footer: 84, pad: 56, perDay: 56 + 48 + 24 });
  const row = rowHeight(data.compact);
  const thumb = row - 20;

  return (
    <div
      ref={ref}
      style={{
        width: POSTER_WIDTH,
        minHeight: POSTER_MIN_HEIGHT,
        background: CREAM,
        fontFamily: FONT,
        color: "#1f2a1f",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Ảnh bìa */}
      <div
        style={{
          height: hero,
          position: "relative",
          overflow: "hidden",
          borderRadius: "0 0 64px 64px",
          background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN} 60%, #66bb6a)`,
          flexShrink: 0,
        }}
      >
        {data.heroPhoto && <img src={data.heroPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,36,12,0.20) 0%, rgba(8,36,12,0.80) 100%)" }} />
        <div style={{ position: "relative", height: "100%", padding: "44px 60px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
          <div style={{ color: "#d6edd6", fontSize: 24, letterSpacing: 5, fontWeight: 700, textTransform: "uppercase" }}>Du lịch Đắk Song</div>
          <div>
            <div style={{ color: "#fff", fontSize: titleSize(data.title, 72), fontWeight: 800, lineHeight: 1.08, letterSpacing: -1, textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}>{data.title}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              {[`${data.days.length} ngày`, `${data.totalStops} điểm đến`].map((t) => (
                <span key={t} style={{ background: "rgba(255,255,255,0.22)", color: "#fff", fontSize: 26, fontWeight: 600, padding: "6px 20px", borderRadius: 999 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Các ngày */}
      <div style={{ padding: "28px 56px 0", flex: 1 }}>
        {data.days.map((d) => (
          <div key={d.day} style={{ background: "#fff", borderRadius: 40, padding: "24px 36px", marginBottom: 24, boxShadow: "0 10px 30px rgba(27,77,32,0.10)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 56 }}>
              <span style={{ background: GREEN, color: "#fff", fontSize: 24, fontWeight: 800, letterSpacing: 3, padding: "8px 24px", borderRadius: 999 }}>NGÀY {d.day}</span>
              <span style={{ color: "#6b7a6b", fontSize: 24, fontWeight: 600 }}>{d.totalLabel}</span>
            </div>
            <div style={{ marginTop: 10 }}>
              {d.stops.length === 0 && <div style={{ fontSize: 28, color: "#6b7a6b", padding: "16px 0" }}>Tự do khám phá</div>}
              {d.stops.map((s, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 20, height: row, borderTop: i === 0 ? "none" : "2px dashed #e4e9de", boxSizing: "border-box" }}
                >
                  <div style={{ width: 104, fontSize: 34, fontWeight: 800, color: BROWN, flexShrink: 0 }}>{s.time}</div>
                  {!data.compact && <Thumb stop={s} size={thumb} radius={20} tint="#e6f2e6" />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: data.compact ? 30 : 33, fontWeight: 700, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5, fontSize: 21, color: "#6b7a6b" }}>
                      <span style={{ background: "#e6f2e6", color: GREEN_DARK, fontWeight: 700, padding: "2px 12px", borderRadius: 999 }}>{s.categoryLabel}</span>
                      {s.travelMin > 0 && <span>{travelText(s.travelMin)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Chân poster */}
      <div style={{ height: 84, background: GREEN_DARK, color: "#d6edd6", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 60px", fontSize: 24, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, letterSpacing: 2 }}>CỔNG DU LỊCH ĐẮK SONG</span>
        <span>{posterFooterUrl()}</span>
      </div>
    </div>
  );
});
ForestPoster.displayName = "ForestPoster";
