import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Draft, DraftDay, Itinerary, Place, PlanResponse, SuggestResponse } from "../types";
import { retime } from "../lib/schedule";
import { isTemplateId } from "../components/poster/PosterCanvas";
import type { TemplateId } from "../components/poster/poster-data";

const STORAGE_KEY = "draft-itinerary";
const TEMPLATE_KEY = "poster-template";

function loadTemplate(): TemplateId {
  try {
    const v = localStorage.getItem(TEMPLATE_KEY);
    return isTemplateId(v) ? v : "forest";
  } catch {
    return "forest";
  }
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

type DraftActions = {
  draft: Draft | null;
  template: TemplateId;
  setTemplate: (t: TemplateId) => void;
  // Ghi chú tạm hiện trên màn ảnh (ví dụ "chỉ đủ điểm cho 2 ngày"), không lưu vào máy
  notice: string | null;
  setNotice: (text: string | null) => void;
  fromSuggest: (res: SuggestResponse) => void;
  fromItinerary: (it: Itinerary) => void;
  // Chốt lịch do AI đề xuất thành lịch đang chỉnh (giữ nguyên giờ AI đã tính)
  fromPlan: (plan: PlanResponse, title?: string) => void;
  setTitle: (title: string) => void;
  moveStop: (day: number, index: number, delta: -1 | 1) => void;
  removeStop: (day: number, index: number) => void;
  addStop: (day: number, place: Place) => void;
  addDay: () => void;
  removeDay: (day: number) => void;
  markSaved: (id: string) => void;
  clear: () => void;
};

const DraftContext = createContext<DraftActions | null>(null);

// Đánh số lại ngày + tính lại giờ sau mỗi thay đổi
const normalize = (days: DraftDay[]) => retime(days.map((d, i) => ({ ...d, day: i + 1 })));

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<Draft | null>(loadDraft);
  const [template, setTemplateState] = useState<TemplateId>(loadTemplate);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (draft) localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Bộ nhớ đầy hoặc bị chặn: lịch vẫn dùng được trong phiên hiện tại
    }
  }, [draft]);

  const actions = useMemo<DraftActions>(() => {
    const updateDays = (fn: (days: DraftDay[]) => DraftDay[]) =>
      setDraft((d) => (d ? { ...d, schedule: normalize(fn(d.schedule)) } : d));
    const updateDay = (day: number, fn: (stops: DraftDay["stops"]) => DraftDay["stops"]) =>
      updateDays((days) => days.map((d) => (d.day === day ? { ...d, stops: fn([...d.stops]) } : d)));

    return {
      draft,
      template,
      notice,
      setNotice,
      setTemplate: (t) => {
        setTemplateState(t);
        try {
          localStorage.setItem(TEMPLATE_KEY, t);
        } catch {
          // không lưu được thì lần sau về mẫu mặc định
        }
      },
      fromSuggest: (res) =>
        setDraft({
          title: `Đắk Song ${res.schedule.length} ngày`,
          interests: res.interests,
          pace: res.pace,
          schedule: res.schedule.map((d) => ({
            day: d.day,
            stops: d.stops.map((s) => ({ place: s.place, startTime: s.startTime })),
          })),
        }),
      fromItinerary: (it) =>
        setDraft({
          id: it.id,
          title: it.title,
          interests: it.interests,
          pace: "normal",
          schedule: normalize(
            Array.from({ length: it.days }, (_, i) => ({
              day: i + 1,
              stops: it.items
                .filter((x) => x.day === i + 1)
                .sort((a, b) => a.order - b.order)
                .map((x) => ({ place: x.place, note: x.note ?? undefined })),
            })),
          ),
        }),
      fromPlan: (plan, title) => {
        const byId = new Map(plan.places.map((p) => [p.id, p]));
        setDraft({
          title: title ?? `Đắk Song ${plan.days.length} ngày`,
          interests: [],
          pace: "normal",
          schedule: plan.days.map((d) => ({
            day: d.day,
            stops: d.stops
              .filter((s) => byId.has(s.placeId))
              .map((s) => ({ place: byId.get(s.placeId)!, startTime: s.startTime, note: s.note ?? undefined, meal: s.meal ?? undefined })),
          })),
        });
        setNotice(null);
      },
      setTitle: (title) => setDraft((d) => (d ? { ...d, title } : d)),
      moveStop: (day, index, delta) =>
        updateDay(day, (stops) => {
          const target = index + delta;
          if (target < 0 || target >= stops.length) return stops;
          [stops[index], stops[target]] = [stops[target], stops[index]];
          return stops;
        }),
      removeStop: (day, index) => updateDay(day, (stops) => stops.filter((_, i) => i !== index)),
      addStop: (day, place) => updateDay(day, (stops) => [...stops, { place }]),
      addDay: () => updateDays((days) => (days.length >= 7 ? days : [...days, { day: days.length + 1, stops: [] }])),
      removeDay: (day) => updateDays((days) => (days.length <= 1 ? days : days.filter((d) => d.day !== day))),
      markSaved: (id) => setDraft((d) => (d ? { ...d, id } : d)),
      clear: () => setDraft(null),
    };
  }, [draft, template, notice]);

  return <DraftContext.Provider value={actions}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft phải nằm trong DraftProvider");
  return ctx;
}
