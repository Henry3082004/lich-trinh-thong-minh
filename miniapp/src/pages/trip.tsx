import React, { useState } from "react";
import { useNavigate, useSnackbar } from "zmp-ui";
import { Screen } from "../components/layout";
import { api } from "../lib/api";
import { useCart } from "../state/cart";
import { useTrip } from "../state/trip";
import type { Pace, Transport } from "../types";

const TRANSPORTS: { id: Transport; icon: string; name: string; hint: string }[] = [
  { id: "o-to", icon: "🚗", name: "Ô tô", hint: "Tự lái / thuê xe" },
  { id: "xe-may", icon: "🏍️", name: "Xe máy", hint: "Tự đi" },
  { id: "xe-khach", icon: "🚌", name: "Xe khách", hint: "Kèm taxi/xe ôm" },
];
const PACES: { id: Pace; name: string }[] = [
  { id: "relaxed", name: "Thư thả" },
  { id: "normal", name: "Vừa phải" },
  { id: "packed", name: "Dày đặc" },
];

function Stepper({ label, value, min, max, onChange, unit }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; unit: string }) {
  return (
    <div className="stepper-row">
      <span>{label}</span>
      <div className="stepper">
        <button aria-label={`Giảm ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <div className="value">
          {value} {unit}
        </div>
        <button aria-label={`Tăng ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

export default function TripPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { count } = useCart();
  const { prefs, setPrefs, setPlan } = useTrip();
  const [loading, setLoading] = useState(false);
  const set = (patch: Partial<typeof prefs>) => setPrefs({ ...prefs, ...patch });
  const today = new Date().toISOString().slice(0, 10);

  const submit = async () => {
    setLoading(true);
    try {
      const plan = await api.plan(prefs);
      setPlan(plan);
      navigate("/plan");
    } catch (e) {
      openSnackbar({ text: (e as Error).message || "Không lên được lịch, bạn thử lại nhé", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Thông tin chuyến đi"
      bottom={
        <div className="bottom-stack">
          <div className="summary">{`${prefs.people} người · ${prefs.days} ngày ${prefs.days - 1} đêm · ${count} mục đã chọn`}</div>
          <button className="btn-primary btn-lg" disabled={loading} onClick={submit}>
            {loading ? "AI đang lên lịch… (có thể mất vài giây)" : "✨ Lên lịch trình"}
          </button>
        </div>
      }
    >
      <div className="content narrow create">
        <h2 className="q-title">Đi mấy người?</h2>
        <div className="card stack" style={{ gap: 4 }}>
          <Stepper label="Số người" unit="người" value={prefs.people} min={1} max={50} onChange={(n) => set({ people: n, kids: Math.min(prefs.kids, n) })} />
          <Stepper label="Trẻ em" unit="bé" value={prefs.kids} min={0} max={prefs.people} onChange={(n) => set({ kids: n })} />
        </div>

        <h2 className="q-title" style={{ marginTop: 10 }}>
          Đi khi nào, mấy ngày?
        </h2>
        <div className="card stack" style={{ gap: 12 }}>
          <label className="field">
            <span>Ngày đi</span>
            <input type="date" min={today} value={prefs.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />
          </label>
          <label className="field">
            <span>Giờ xuất phát</span>
            <input type="time" value={prefs.startTime} onChange={(e) => e.target.value && set({ startTime: e.target.value })} />
          </label>
          <div className="day-picker" role="radiogroup" aria-label="Số ngày">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={prefs.days === n} className={prefs.days === n ? "on" : ""} onClick={() => set({ days: n })}>
                <b>{n}</b>
                <span>{n} đêm</span>
              </button>
            ))}
          </div>
          <div className="muted" style={{ textAlign: "center" }}>
            {prefs.days} ngày {prefs.days - 1} đêm
          </div>
        </div>

        <h2 className="q-title" style={{ marginTop: 10 }}>
          Đi bằng gì?
        </h2>
        <div className="transport-grid" role="radiogroup" aria-label="Phương tiện">
          {TRANSPORTS.map((t) => (
            <button key={t.id} role="radio" aria-checked={prefs.transport === t.id} className={`transport ${prefs.transport === t.id ? "on" : ""}`} onClick={() => set({ transport: t.id })}>
              <span className="transport-icon" aria-hidden>
                {t.icon}
              </span>
              <b>{t.name}</b>
              <small>{t.hint}</small>
            </button>
          ))}
        </div>

        <h2 className="q-title" style={{ marginTop: 10 }}>
          Nhịp độ
        </h2>
        <div className="chips" role="radiogroup" aria-label="Nhịp độ">
          {PACES.map((p) => (
            <button key={p.id} role="radio" aria-checked={prefs.pace === p.id} className={`chip ${prefs.pace === p.id ? "active" : ""}`} onClick={() => set({ pace: p.id })}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
