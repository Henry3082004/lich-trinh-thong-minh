import React, { forwardRef } from "react";
import type { PosterData, TemplateId } from "./poster-data";
import { PhotoPoster } from "./templates/photo";
import namNung from "../../assets/poster/nam-nung.jpg";
import luuLy from "../../assets/poster/luu-ly.jpg";
import anh3 from "../../assets/poster/anh-3.jpg";

// 3 nền ảnh thiên nhiên Đắk Song (ảnh đóng gói trong app nên chụp poster không bị chặn CORS)
export const TEMPLATES: { id: TemplateId; name: string; photo: string }[] = [
  { id: "nam-nung", name: "Nâm Nung", photo: namNung },
  { id: "luu-ly", name: "Lưu Ly", photo: luuLy },
  { id: "rung-da", name: "Rừng đá", photo: anh3 },
];

export const isTemplateId = (v: unknown): v is TemplateId => TEMPLATES.some((t) => t.id === v);

// ref trỏ vào thẻ gốc của poster (để chụp ảnh); bg là ảnh nền đã tải thành data URL
export const PosterCanvas = forwardRef<HTMLDivElement, { data: PosterData; bg: string | null }>(({ data, bg }, ref) => (
  <PhotoPoster ref={ref} data={data} bg={bg} />
));
PosterCanvas.displayName = "PosterCanvas";
