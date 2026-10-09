import React, { forwardRef } from "react";
import type { PosterData, TemplateId } from "./poster-data";
import { ForestPoster } from "./templates/forest";
import { MinimalPoster } from "./templates/minimal";
import { SunsetPoster } from "./templates/sunset";

export const TEMPLATES: { id: TemplateId; name: string; swatch: [string, string] }[] = [
  { id: "forest", name: "Rừng xanh", swatch: ["#1b4d20", "#66bb6a"] },
  { id: "sunset", name: "Hoàng hôn", swatch: ["#6d4c41", "#f6ecdc"] },
  { id: "minimal", name: "Tối giản", swatch: ["#faf7f0", "#2e7d32"] },
];

export const isTemplateId = (v: unknown): v is TemplateId => TEMPLATES.some((t) => t.id === v);

// Chọn mẫu theo id; ref trỏ vào thẻ gốc của poster (để chụp ảnh)
export const PosterCanvas = forwardRef<HTMLDivElement, { data: PosterData; template: TemplateId }>(({ data, template }, ref) => {
  if (template === "sunset") return <SunsetPoster ref={ref} data={data} />;
  if (template === "minimal") return <MinimalPoster ref={ref} data={data} />;
  return <ForestPoster ref={ref} data={data} />;
});
PosterCanvas.displayName = "PosterCanvas";
