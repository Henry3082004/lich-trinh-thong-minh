import React, { forwardRef } from "react";
import { POSTER_MIN_HEIGHT, POSTER_WIDTH, posterFooterUrl, type PosterData } from "../poster-data";
import { FONT, heroHeight, SERIF, subtitleOf, Thumb, titleSize } from "./shared";

// Mẫu "Hoàng hôn": nền kem ấm, tiêu đề chữ có chân, mỗi ngày một huy hiệu tròn nâu, trục thời gian nét đứt
const BG = "#f6ecdc";
const BROWN = "#6d4c41";
const INK = "#3e2a22";
const GREEN = "#2e7d32";

export const SunsetPoster = forwardRef<HTMLDivElement, { data: PosterData }>(({ data }, ref) => {
  const compact = data.compact;
  const row = compact ? 84 : 180;
  const hero = heroHeight(data, { header: 0, footer: 80, pad: 48, perDay: 170, row, min: 640, max: 860 });

  return (
    <div
      ref={ref}
      style={{
        width: POSTER_WIDTH,
        minHeight: POSTER_MIN_HEIGHT,
        background: BG,
        fontFamily: FONT,
        color: INK,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Ảnh bìa + tiêu đề giữa */}
      <div style={{ height: hero, position: "relative", overflow: "hidden", flexShrink: 0, background: `linear-gradient(160deg, ${BROWN}, #b07a4f 60%, #e0b27c)` }}>
        {data.heroPhoto && <img src={data.heroPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(109,76,65,0.55) 0%, rgba(214,140,60,0.18) 45%, rgba(246,236,220,0) 70%, #f6ecdc 100%)" }} />
        <div style={{ position: "absolute", top: 72, left: 0, right: 0, textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: 8, textTransform: "uppercase" }}>Đắk Song · Đắk Nông</div>
          <div style={{ fontFamily: SERIF, fontSize: titleSize(data.title, 112), lineHeight: 1.04, fontWeight: 700, margin: "28px 80px 0", textShadow: "0 4px 30px rgba(62,42,34,0.35)" }}>{data.title}</div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 40, marginTop: 22 }}>{subtitleOf(data)}</div>
        </div>
      </div>

      {/* Các ngày */}
      <div style={{ padding: "0 80px 48px", marginTop: -80, position: "relative", display: "flex", flexDirection: "column", gap: 56, flex: 1 }}>
        {data.days.map((d) => (
          <div key={d.day}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
              <div style={{ width: 112, height: 112, borderRadius: 56, background: BROWN, color: "#faf7f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 2 }}>NGÀY</div>
                <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{d.day}</div>
              </div>
              <div style={{ height: 2, flex: 1, background: "#d9c3a5" }} />
              <div style={{ fontSize: 28, color: BROWN, fontWeight: 600 }}>{d.totalLabel}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, borderLeft: "3px dashed #c9a27a", marginLeft: 54, paddingLeft: 44 }}>
              {d.stops.length === 0 && <div style={{ fontSize: 30, color: BROWN }}>Tự do khám phá</div>}
              {d.stops.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 28,
                    background: "#fffaf2",
                    borderRadius: compact ? 28 : 36,
                    padding: compact ? "14px 28px" : "20px 32px 20px 20px",
                    boxShadow: "0 6px 24px rgba(109,76,65,0.10)",
                  }}
                >
                  {!compact && (
                    <div style={{ border: "6px solid #f6ecdc", borderRadius: 76, flexShrink: 0, lineHeight: 0 }}>
                      <Thumb stop={s} size={128} radius={64} tint="#efe0c8" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: compact ? 26 : 30, fontWeight: 700, color: GREEN }}>{s.time}</div>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontSize: compact ? 32 : 42,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        marginTop: 4,
                        ...(compact ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } : {}),
                      }}
                    >
                      {s.name}
                    </div>
                    {!compact && <div style={{ fontSize: 26, color: BROWN, marginTop: 6 }}>{[s.categoryLabel, s.duration].filter(Boolean).join(" · ")}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginTop: "auto", textAlign: "center", fontSize: 28, color: BROWN, paddingTop: 8 }}>
          <span style={{ fontWeight: 700, color: "#1b4d20" }}>Lịch trình Đắk Song</span> · {posterFooterUrl()}
        </div>
      </div>
    </div>
  );
});
SunsetPoster.displayName = "SunsetPoster";
