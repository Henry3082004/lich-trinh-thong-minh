import React, { useState } from "react";
import { useNavigate, useSearchParams, useSnackbar } from "zmp-ui";
import { Screen } from "../components/layout";
import { api } from "../lib/api";
import { useCart } from "../state/cart";
import { useTrip } from "../state/trip";
import type { Pace, Purpose, Transport } from "../types";
import {
  IconBuildingMonument,
  IconBus,
  IconCar,
  IconChevronDown,
  IconCircle,
  IconCircleCheckFilled,
  IconClockHour7,
  IconFeather,
  IconMinus,
  IconMoodKid,
  IconMotorbike,
  IconPlus,
  IconRun,
  IconSparkles,
  IconTrekking,
  IconUsers,
  IconWalk,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

const TRANSPORTS: { id: Transport; Icon: TablerIcon; name: string; hint: string }[] = [
  { id: "o-to", Icon: IconCar, name: "Ô tô", hint: "Tự lái hoặc thuê xe" },
  { id: "xe-may", Icon: IconMotorbike, name: "Xe máy", hint: "Linh hoạt, dễ di chuyển" },
  { id: "xe-khach", Icon: IconBus, name: "Xe khách", hint: "Kết hợp taxi, xe ôm" },
];
const PURPOSES: { id: Purpose; Icon: TablerIcon; name: string; hint: string }[] = [
  { id: "sightseeing", Icon: IconBuildingMonument, name: "Danh thắng & văn hoá", hint: "Thắng cảnh, di tích, lễ hội" },
  { id: "nature", Icon: IconTrekking, name: "Thiên nhiên & trekking", hint: "Rừng, thác, cung đường dã ngoại" },
];
const dayLabel = (n: number) => (n === 1 ? "Đi về trong ngày" : `${n} ngày ${n - 1} đêm`);
const PACES: { id: Pace; Icon: TablerIcon; name: string }[] = [
  { id: "relaxed", Icon: IconFeather, name: "Nhẹ nhàng" },
  { id: "normal", Icon: IconWalk, name: "Vừa phải" },
  { id: "packed", Icon: IconRun, name: "Khám phá nhiều" },
];
const PARTY_NAME: Record<string, string> = { solo: "Một mình", couple: "Cặp đôi", friends: "Nhóm bạn", family: "Gia đình" };

function Stepper({ label, Icon, value, min, max, onChange, unit }: { label: string; Icon: TablerIcon; value: number; min: number; max: number; onChange: (n: number) => void; unit: string }) {
  return (
    <div className="t-row">
      <span className="t-label">
        <Icon size={20} stroke={2} aria-hidden />
        {label}
      </span>
      <div className="t-stepper">
        <button className="dec" aria-label={`Giảm ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <IconMinus size={20} stroke={2} />
        </button>
        <b>
          {value} {unit}
        </b>
        <button className="inc" aria-label={`Tăng ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <IconPlus size={20} stroke={2} />
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
            <IconSparkles size={20} stroke={2} aria-hidden />
            {loading ? "Đang chuẩn bị lịch trình cho bạn…" : "Tạo lịch trình"}
          </button>
        </div>
      }
    >
      <div className="content narrow t-form">
        <div className="t-intro">
          <IconSparkles size={20} stroke={2} aria-hidden />
          {auto ? (
            <span>
              {prefs.party ? (
                <>
                  Chuyến <b>{PARTY_NAME[prefs.party]}</b>: AI
                </>
              ) : (
                "AI"
              )}{" "}
              sẽ tự gợi ý địa điểm phù hợp cho bạn.
            </span>
          ) : (
            <span>
              AI sẽ xếp lịch cho <b>{count} địa điểm</b> bạn đã chọn, thêm bữa ăn nếu cần.
            </span>
          )}
        </div>

        <h3 className="q-title">Thành viên tham gia</h3>
        <div className="t-card">
          <Stepper label="Tổng số người" Icon={IconUsers} unit="người" value={prefs.people} min={1} max={50} onChange={(n) => set({ people: n, kids: Math.min(prefs.kids, n) })} />
          <Stepper label="Trong đó trẻ em" Icon={IconMoodKid} unit="trẻ" value={prefs.kids} min={0} max={prefs.people} onChange={(n) => set({ kids: n })} />
        </div>

        <h3 className="q-title">Thời gian</h3>
        <div className="t-card t-time">
          <label className="t-row">
            <span className="t-label">
              <IconClockHour7 size={20} stroke={2} aria-hidden />
              Giờ khởi hành
            </span>
            <span className="t-timebox">
              <input type="time" value={prefs.startTime} onChange={(e) => e.target.value && set({ startTime: e.target.value })} aria-label="Giờ khởi hành" />
              <IconChevronDown size={16} stroke={2} aria-hidden />
            </span>
          </label>
          <div className="t-days" role="radiogroup" aria-label="Số ngày">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={prefs.days === n} className={prefs.days === n ? "on" : ""} onClick={() => set({ days: n })}>
                <b>{n}</b>
                <span>{n === 1 ? "Trong ngày" : `${n}N${n - 1}Đ`}</span>
              </button>
            ))}
          </div>
        </div>

        <h3 className="q-title">
          Trải nghiệm mong muốn <small>· chọn 1 hoặc cả 2</small>
        </h3>
        <div className="t-purposes" role="group" aria-label="Trải nghiệm mong muốn">
          {PURPOSES.map((t) => {
            const on = (prefs.purposes ?? []).includes(t.id);
            return (
              <button
                key={t.id}
                aria-pressed={on}
                className={`t-purpose ${on ? "on" : ""}`}
                onClick={() => set({ purposes: on ? (prefs.purposes ?? []).filter((x) => x !== t.id) : [...(prefs.purposes ?? []), t.id] })}
              >
                <span className="t-purpose-ico">
                  <t.Icon size={22} stroke={2} aria-hidden />
                </span>
                <span className="t-purpose-text">
                  <b>{t.name}</b>
                  <span>{t.hint}</span>
                </span>
                {on ? <IconCircleCheckFilled className="t-check on" size={24} aria-hidden /> : <IconCircle className="t-check" size={24} stroke={1.5} aria-hidden />}
              </button>
            );
          })}
        </div>

        <h3 className="q-title">Phương tiện</h3>
        <div className="t-transports" role="radiogroup" aria-label="Phương tiện">
          {TRANSPORTS.map((t) => (
            <button key={t.id} role="radio" aria-checked={prefs.transport === t.id} className={`t-transport ${prefs.transport === t.id ? "on" : ""}`} onClick={() => set({ transport: t.id })}>
              <t.Icon size={26} stroke={2} aria-hidden />
              <b>{t.name}</b>
              <span>{t.hint}</span>
            </button>
          ))}
        </div>

        <h3 className="q-title">Nhịp độ</h3>
        <div className="t-pace" role="radiogroup" aria-label="Nhịp độ">
          {PACES.map((p) => (
            <button key={p.id} role="radio" aria-checked={prefs.pace === p.id} className={prefs.pace === p.id ? "on" : ""} onClick={() => set({ pace: p.id })}>
              <p.Icon size={18} stroke={2} aria-hidden />
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
