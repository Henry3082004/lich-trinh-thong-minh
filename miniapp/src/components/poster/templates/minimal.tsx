import React, { forwardRef } from "react";
import { POSTER_MIN_HEIGHT, POSTER_WIDTH, posterFooterUrl, type PosterData } from "../poster-data";
import { FONT, titleSize } from "./shared";

// Mẫu "Tối giản": nền trắng, chữ lớn, đường kẻ mảnh, dải ảnh ngang. Gọn nên chứa được lịch dài.
const INK = "#111111";
const MUTED = "#757575";
const ACCENT = "#1b4d20";

export const MinimalPoster = forwardRef<HTMLDivElement, { data: PosterData }>(({ data }, ref) => {
  // Dải ảnh: tối đa 3 ảnh khác nhau
  const strip = [...new Set(data.days.flatMap((d) => d.stops.map((s) => s.photo)).filter((p): p is string => !!p))].slice(0, 3);
  let index = 0;

  return (
    <div
      ref={ref}
      style={{
        width: POSTER_WIDTH,
        minHeight: POSTER_MIN_HEIGHT,
        background: "#fff",
        fontFamily: FONT,
        color: INK,
        display: "flex",
        flexDirection: "column",
        padding: "68px 72px 0",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 6, fontWeight: 700, textTransform: "uppercase" }}>
        <span>Du lịch Đắk Song</span>
        <span style={{ color: ACCENT }}>● {data.days.length} ngày</span>
      </div>

      <div style={{ marginTop: 44, fontSize: titleSize(data.title, 96), fontWeight: 800, lineHeight: 1.02, letterSpacing: -3 }}>{data.title}</div>
      <div style={{ marginTop: 20, fontSize: 28, color: MUTED }}>
        {data.days.length} ngày · {data.totalStops} điểm đến
      </div>

      {strip.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginTop: 40, height: data.compact ? 170 : 230 }}>
          {strip.map((src, i) => (
            <img key={i} src={src} alt="" style={{ flex: 1, minWidth: 0, height: "100%", objectFit: "cover", borderRadius: 18 }} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 44, flex: 1 }}>
        {data.days.map((d) => (
          <div key={d.day} style={{ marginBottom: 34 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 22, letterSpacing: 5, fontWeight: 800 }}>
              <span>NGÀY {String(d.day).padStart(2, "0")}</span>
              <span style={{ flex: 1, height: 3, background: INK }} />
              <span style={{ fontWeight: 600, letterSpacing: 1, color: MUTED }}>{d.totalLabel}</span>
            </div>
            {d.stops.length === 0 && <div style={{ fontSize: 28, color: MUTED, padding: "18px 0" }}>Tự do khám phá</div>}
            {d.stops.map((s, i) => {
              index += 1;
              return (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 24, padding: "18px 0", borderBottom: "1px solid #e6e6e6" }}>
                  <span style={{ width: 46, fontSize: 22, color: ACCENT, fontWeight: 800 }}>{String(index).padStart(2, "0")}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 33, fontWeight: 700, lineHeight: 1.15 }}>{s.name}</div>
                    <div style={{ marginTop: 4, fontSize: 21, color: MUTED }}>
                      {s.categoryLabel} · {s.duration}
                    </div>
                  </div>
                  <span style={{ fontSize: 30, fontWeight: 800 }}>{s.time}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ borderTop: `3px solid ${INK}`, height: 84, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 22, color: MUTED }}>
        <span style={{ fontWeight: 700, letterSpacing: 2, color: INK }}>CỔNG DU LỊCH ĐẮK SONG</span>
        <span>{posterFooterUrl()}</span>
      </div>
    </div>
  );
});
MinimalPoster.displayName = "MinimalPoster";
