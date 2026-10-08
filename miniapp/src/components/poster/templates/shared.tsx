import React from "react";
import { POSTER_MIN_HEIGHT, type PosterData, type PosterStop } from "../poster-data";

export const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Chiều cao hàng điểm dừng; lịch dài (compact) thì hàng thấp hơn và không có ảnh nhỏ
export const rowHeight = (compact: boolean) => (compact ? 68 : 96);

// Ảnh bìa tự co giãn: lịch ngắn thì bìa cao hơn để poster vẫn đầy khổ 4:5, lịch dài thì bìa thấp lại
export function heroHeight(data: PosterData, fixed: { header: number; footer: number; pad: number; perDay: number }): number {
  const body = data.days.length * fixed.perDay + data.totalStops * rowHeight(data.compact) + fixed.header + fixed.footer + fixed.pad;
  return Math.max(250, Math.min(780, POSTER_MIN_HEIGHT - body));
}

// Ảnh vuông bo góc; không có ảnh thì dùng nền màu + biểu tượng loại để poster không bao giờ vỡ
export function Thumb({
  stop,
  size,
  radius,
  tint,
}: {
  stop: Pick<PosterStop, "photo" | "icon">;
  size: number;
  radius: number;
  tint: string;
}) {
  return stop.photo ? (
    <img src={stop.photo} alt="" style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", display: "block", flexShrink: 0 }} />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: tint,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
      }}
    >
      {stop.icon}
    </div>
  );
}

// Cỡ chữ tiêu đề giảm dần theo độ dài để không tràn dòng
export const titleSize = (title: string, base: number) => (title.length > 34 ? base * 0.72 : title.length > 22 ? base * 0.86 : base);

export const travelText = (min: number) => (min > 0 ? `${min} phút di chuyển` : "");
