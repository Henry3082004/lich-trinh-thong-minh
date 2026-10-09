import React, { useState } from "react";
import { useNavigate, useSearchParams, useSnackbar } from "zmp-ui";
import { Screen } from "../components/layout";
import { api } from "../lib/api";
import { useCart } from "../state/cart";
import { useTrip } from "../state/trip";
import type { Pace, Purpose, Transport } from "../types";

const TRANSPORTS: { id: Transport; icon: string; name: string; hint: string }[] = [
  { id: "o-to", icon: "🚗", name: "Ô tô", hint: "Tự lái hoặc thuê xe" },
  { id: "xe-may", icon: "🏍️", name: "Xe máy", hint: "Linh hoạt, dễ di chuyển" },
  { id: "xe-khach", icon: "🚌", name: "Xe khách", hint: "Kết hợp taxi, xe ôm" },
];
const PURPOSES: { id: Purpose; icon: string; name: string; hint: string }[] = [
  { id: "sightseeing", icon: "🏛️", name: "Danh thắng & văn hoá", hint: "Thắng cảnh, di tích, lễ hội" },
  { id: "nature", icon: "🥾", name: "Thiên nhiên & trekking", hint: "Rừng, thác, cung đường dã ngoại" },
];
const dayLabel = (n: number) => (n === 1 ? "Đi về trong ngày" : `${n} ngày ${n - 1} đêm`);
const PACES: { id: Pace; name: string }[] = [
  { id: "relaxed", name: "Nhẹ nhàng" },
  { id: "normal", name: "Vừa phải" },
  { id: "packed", name: "Khám phá nhiều" },
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
  const [params] = useSearchParams();
  // ?auto=1: vào từ nút "Bạn đi" ở trang chủ, AI tự chọn địa điểm; còn lại dùng các mục trong giỏ
  const auto = params.get("auto") === "1";
  const { prefs, setPrefs, setPlan } = useTrip();
  const [loading, setLoading] = useState(false);
  const set = (patch: Partial<typeof prefs>) => setPrefs({ ...prefs, ...patch });
  // Không hỏi ngày đi nữa: lấy hôm nay (ngày theo giờ máy)
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const submit = async () => {
    setLoading(true);
    try {
      const p = { ...prefs, startDate: today, autoPick: auto };
      setPrefs(p);
      const plan = await api.plan(p);
      setPlan(plan);
      navigate("/plan");
    } catch (e) {
      openSnackbar({ text: (e as Error).message || "Chưa thể tạo lịch trình, bạn vui lòng thử lại nhé", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Lên kế hoạch chuyến đi"
      bottom={
        <div className="bottom-stack">
          <div className="summary">{`${prefs.people} người · ${dayLabel(prefs.days)} · ${auto ? "AI gợi ý địa điểm" : `${count} địa điểm đã chọn`}`}</div>
          <button className="btn-primary btn-lg" disabled={loading} onClick={submit}>
            {loading ? "Đang chuẩn bị lịch trình cho bạn…" : "✨ Tạo lịch trình"}
          </button>
        </div>
      }
    >
      <div className="content narrow create">
        <h2 className="q-title">Thành viên tham gia</h2>
        <div className="card stack" style={{ gap: 4 }}>
          <Stepper label="Tổng số người" unit="người" value={prefs.people} min={1} max={50} onChange={(n) => set({ people: n, kids: Math.min(prefs.kids, n) })} />
          <Stepper label="Trong đó trẻ em" unit="trẻ" value={prefs.kids} min={0} max={prefs.people} onChange={(n) => set({ kids: n })} />
        </div>

        <h2 className="q-title" style={{ marginTop: 10 }}>
          Thời gian chuyến đi
        </h2>
        <div className="card stack" style={{ gap: 12 }}>
          <label className="field">
            <span>Giờ khởi hành</span>
            <input type="time" value={prefs.startTime} onChange={(e) => e.target.value && set({ startTime: e.target.value })} />
          </label>
          <div className="day-picker" role="radiogroup" aria-label="Số ngày">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={prefs.days === n} className={prefs.days === n ? "on" : ""} onClick={() => set({ days: n })}>
                <b>{n}</b>
                <span>{n === 1 ? "Trong ngày" : `${n}N${n - 1}Đ`}</span>
              </button>
            ))}
          </div>
          <div className="muted" style={{ textAlign: "center" }}>
            {dayLabel(prefs.days)}
          </div>
        </div>

        <h2 className="q-title" style={{ marginTop: 10 }}>
          Trải nghiệm bạn mong muốn
        </h2>
        <div className="transport-grid purpose-grid" role="group" aria-label="Mục đích chuyến đi">
          {PURPOSES.map((t) => {
            const on = (prefs.purposes ?? []).includes(t.id);
            return (
              <button
                key={t.id}
                aria-pressed={on}
                className={`transport ${on ? "on" : ""}`}
                onClick={() => set({ purposes: on ? (prefs.purposes ?? []).filter((x) => x !== t.id) : [...(prefs.purposes ?? []), t.id] })}
              >
                <span className="transport-icon" aria-hidden>
                  {t.icon}
                </span>
                <b>{t.name}</b>
                <small>{t.hint}</small>
              </button>
            );
          })}
        </div>
        <div className="muted" style={{ textAlign: "center", marginTop: -4 }}>
          Có thể chọn một hoặc cả hai
        </div>

        <h2 className="q-title" style={{ marginTop: 10 }}>
          Phương tiện di chuyển
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
          Nhịp độ tham quan
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
