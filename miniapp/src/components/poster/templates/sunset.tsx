import React, { forwardRef } from "react";
import { POSTER_MIN_HEIGHT, POSTER_WIDTH, posterFooterUrl, type PosterData } from "../poster-data";
import { FONT, heroHeight, rowHeight, Thumb, titleSize, travelText } from "./shared";

// Mẫu "Hoàng hôn": tông cam đất ấm, thẻ tiêu đề nổi, trục thời gian dọc
const ORANGE = "#e8782a";
const ORANGE_SOFT = "#f6a35c";
const BROWN_DARK = "#4a2511";
const SAND = "#fff3e2";

export const SunsetPoster = forwardRef<HTMLDivElement, { data: PosterData }>(({ data }, ref) => {
  const hero = heroHeight(data, { header: 130, footer: 80, pad: 40, perDay: 76 + 20 });
  const row = rowHeight(data.compact);
  const thumb = row - 24;

  return (
    <div
      ref={ref}
      style={{
        width: POSTER_WIDTH,
        minHeight: POSTER_MIN_HEIGHT,
        background: `linear-gradient(180deg, ${SAND} 0%, #ffe0bf 100%)`,
        fontFamily: FONT,
        color: BROWN_DARK,
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
          borderRadius: "0 0 72px 72px",
          background: `linear-gradient(160deg, #f6a35c, ${ORANGE} 55%, #b3501a)`,
          flexShrink: 0,
        }}
      >
        {data.heroPhoto && <img src={data.heroPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,150,70,0.18) 0%, rgba(90,30,5,0.62) 100%)" }} />
        <div style={{ position: "relative", padding: "44px 60px", color: "#fff3e2", fontSize: 24, letterSpacing: 5, fontWeight: 700, textTransform: "uppercase" }}>
          ☀ Du lịch Đắk Song
        </div>
      </div>

      {/* Thẻ tiêu đề nổi lên ảnh bìa */}
      <div
        style={{
          margin: "-64px 56px 0",
          background: "#fff",
          borderRadius: 36,
          padding: "26px 40px",
          boxShadow: "0 14px 36px rgba(120,50,10,0.18)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: titleSize(data.title, 58), fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.5, color: BROWN_DARK }}>{data.title}</div>
        <div style={{ marginTop: 8, fontSize: 26, fontWeight: 700, color: ORANGE }}>
          {data.days.length} ngày · {data.totalStops} điểm đến
        </div>
      </div>

      {/* Trục thời gian */}
      <div style={{ padding: "28px 56px 0", flex: 1 }}>
        {data.days.map((d) => (
          <div key={d.day} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, height: 56, marginBottom: 12 }}>
              <span style={{ background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_SOFT})`, color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: 3, padding: "8px 30px", borderRadius: 999 }}>NGÀY {d.day}</span>
              <span style={{ flex: 1, height: 3, background: "rgba(232,120,42,0.35)", borderRadius: 2 }} />
              <span style={{ fontSize: 23, fontWeight: 600, color: "#9a5b32" }}>{d.totalLabel}</span>
            </div>
            <div style={{ position: "relative", paddingLeft: 138 }}>
              <div style={{ position: "absolute", left: 120, top: 14, bottom: 14, width: 5, background: "rgba(232,120,42,0.4)", borderRadius: 3 }} />
              {d.stops.length === 0 && <div style={{ fontSize: 28, color: "#9a5b32", padding: "12px 0" }}>Tự do khám phá</div>}
              {d.stops.map((s, i) => (
                <div key={i} style={{ position: "relative", height: row, display: "flex", alignItems: "center" }}>
                  <div style={{ position: "absolute", left: -138, width: 100, textAlign: "right", fontSize: 30, fontWeight: 800, color: "#b45309" }}>{s.time}</div>
                  <div style={{ position: "absolute", left: -29, width: 24, height: 24, borderRadius: 12, background: "#fff", border: `6px solid ${ORANGE}`, boxSizing: "border-box" }} />
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      background: "#fff",
                      borderRadius: 28,
                      padding: data.compact ? "8px 22px" : "8px 12px",
                      height: row - 8,
                      boxSizing: "border-box",
                      boxShadow: "0 6px 18px rgba(120,50,10,0.10)",
                    }}
                  >
                    {!data.compact && <Thumb stop={s} size={thumb - 8} radius={20} tint="#ffe9d2" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: data.compact ? 28 : 31, fontWeight: 700, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                      <div style={{ marginTop: 4, fontSize: 21, color: "#9a5b32", display: "flex", gap: 10 }}>
                        <span style={{ fontWeight: 700, color: ORANGE }}>{s.categoryLabel}</span>
                        {s.travelMin > 0 && <span>· {travelText(s.travelMin)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 60px", fontSize: 23, color: "#9a5b32", flexShrink: 0 }}>
        <span style={{ fontWeight: 700, letterSpacing: 2 }}>CỔNG DU LỊCH ĐẮK SONG</span>
        <span>{posterFooterUrl()}</span>
      </div>
    </div>
  );
});
SunsetPoster.displayName = "SunsetPoster";
