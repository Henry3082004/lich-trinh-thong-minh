import React, { forwardRef } from "react";
import { POSTER_MIN_HEIGHT, POSTER_WIDTH, posterFooterUrl, type PosterData } from "../poster-data";
import { dayMeta, FONT, heroHeight, subtitleOf, Thumb, titleSize } from "./shared";

// Mẫu "Rừng xanh": nền xanh đậm, ảnh bìa lớn chuyển dần vào nền, thẻ kem cho từng ngày
const GREEN_DARK = "#1b4d20";
const GREEN = "#2e7d32";
const CREAM = "#faf7f0";
const BROWN = "#6d4c41";

export const ForestPoster = forwardRef<HTMLDivElement, { data: PosterData }>(({ data }, ref) => {
  const compact = data.compact;
  const row = compact ? 84 : 194;
  const hero = heroHeight(data, { header: 0, footer: 100, pad: 64, perDay: 190, row, min: 540, max: 720 });

  return (
    <div
      ref={ref}
      style={{
        width: POSTER_WIDTH,
        minHeight: POSTER_MIN_HEIGHT,
        background: GREEN_DARK,
        fontFamily: FONT,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Ảnh bìa */}
      <div style={{ height: hero, position: "relative", overflow: "hidden", flexShrink: 0, background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN} 60%, #66bb6a)` }}>
        {data.heroPhoto && <img src={data.heroPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(27,77,32,0) 30%, rgba(27,77,32,0.55) 70%, #1b4d20 100%)" }} />
        <div
          style={{
            position: "absolute",
            top: 64,
            left: 72,
            padding: "14px 26px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            color: GREEN_DARK,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          ĐẮK SONG · ĐẮK NÔNG
        </div>
        <div style={{ position: "absolute", left: 72, right: 72, bottom: 56 }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: "#c8e6c9", letterSpacing: 2, textTransform: "uppercase" }}>{subtitleOf(data)}</div>
          <div style={{ fontSize: titleSize(data.title, 104), fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 14 }}>{data.title}</div>
        </div>
      </div>

      {/* Các ngày */}
      <div style={{ padding: "24px 56px 40px", display: "flex", flexDirection: "column", gap: 36, flex: 1 }}>
        {data.days.map((d) => (
          <div key={d.day} style={{ background: CREAM, borderRadius: 44, padding: "44px 44px 20px", color: GREEN_DARK }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 52, fontWeight: 800 }}>Ngày {d.day}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: BROWN }}>{dayMeta(d)}</div>
            </div>
            {d.stops.length === 0 && <div style={{ fontSize: 30, color: BROWN, padding: "20px 0" }}>Tự do khám phá</div>}
            {d.stops.map((s, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 28, height: row, borderTop: "2px solid #e8e2d4", boxSizing: "border-box" }}
              >
                <div style={{ width: 116, flexShrink: 0, fontSize: compact ? 34 : 38, fontWeight: 800, color: GREEN }}>{s.time}</div>
                {!compact && <Thumb stop={s} size={150} radius={28} tint="#dfe8d8" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={
                      compact
                        ? { fontSize: 34, fontWeight: 700, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
                        : { fontSize: 40, fontWeight: 700, lineHeight: 1.2 }
                    }
                  >
                    {s.name}
                  </div>
                  <div style={{ fontSize: compact ? 24 : 28, color: BROWN, marginTop: compact ? 2 : 8, fontWeight: 500 }}>
                    {[s.categoryLabel, s.duration].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, color: "#c8e6c9", padding: "8px 8px 0" }}>
          <div style={{ fontWeight: 700, color: "#fff" }}>Lịch trình Đắk Song</div>
          <div>{posterFooterUrl()}</div>
        </div>
      </div>
    </div>
  );
});
ForestPoster.displayName = "ForestPoster";
