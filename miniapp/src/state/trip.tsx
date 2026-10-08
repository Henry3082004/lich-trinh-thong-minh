import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PlanResponse, TripPrefs } from "../types";

// Thông tin chuyến đi khách đã chọn + lịch AI vừa đề xuất (chỉ giữ trong phiên; prefs nhớ cho lần sau)
const PREFS_KEY = "trip-prefs";

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const defaultPrefs = (): TripPrefs => ({ people: 2, kids: 0, startDate: todayLocal(), startTime: "08:00", days: 2, transport: "o-to", pace: "normal" });

function loadPrefs(): TripPrefs {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null") as Partial<TripPrefs> | null;
    const base = defaultPrefs();
    if (!saved) return base;
    // Ngày đi đã qua thì quay về hôm nay
    return { ...base, ...saved, startDate: saved.startDate && saved.startDate >= base.startDate ? saved.startDate : base.startDate };
  } catch {
    return defaultPrefs();
  }
}

type TripApi = {
  prefs: TripPrefs;
  setPrefs: (p: TripPrefs) => void;
  plan: PlanResponse | null;
  setPlan: (p: PlanResponse | null) => void;
};

const TripContext = createContext<TripApi | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<TripPrefs>(loadPrefs);
  const [plan, setPlan] = useState<PlanResponse | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // không lưu được thì lần sau nhập lại
    }
  }, [prefs]);

  const value = useMemo(() => ({ prefs, setPrefs, plan, setPlan }), [prefs, plan]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip phải nằm trong TripProvider");
  return ctx;
}
