import React, { useState } from "react";
import { Button, useNavigate, useSnackbar } from "zmp-ui";
import { Screen } from "../components/layout";
import { api } from "../lib/api";
import { dayRouteUrl, MAX_WAYPOINTS } from "../lib/maps";
import { openLink } from "../lib/zalo";
import { useDraft } from "../state/draft";
import { categoryIcon } from "../types";

export default function EditorPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { draft, setTitle, moveStop, removeStop, addDay, removeDay, markSaved } = useDraft();
  const [saving, setSaving] = useState(false);

  if (!draft) {
    return (
      <Screen title="Lịch trình">
        <div className="empty">
          <p>Chưa có lịch trình nào đang chỉnh.</p>
          <Button onClick={() => navigate("/create", { replace: true })}>Tạo lịch trình</Button>
        </div>
      </Screen>
    );
  }

  const isEmpty = draft.schedule.every((d) => d.stops.length === 0);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await api.save(draft);
      markSaved(saved.id);
      openSnackbar({ text: "Đã lưu lịch trình", type: "success" });
    } catch (e) {
      openSnackbar({ text: `Không lưu được: ${(e as Error).message}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      title="Chỉnh lịch trình"
      bottom={
        <>
          <Button variant="secondary" loading={saving} disabled={isEmpty} onClick={save}>
            {draft.id ? "Cập nhật" : "Lưu"}
          </Button>
          <Button disabled={isEmpty} onClick={() => navigate("/export")}>
            Xuất ảnh
          </Button>
        </>
      }
    >
      <div className="content">
        <div className="editor-head">
        <input
          className="title-input"
          value={draft.title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Tên lịch trình"
        />
        <div className="muted" style={{ margin: "6px 0 16px" }}>
          Giờ được tính tự động từ 08:00, gồm thời gian tham quan và di chuyển.
        </div>
        </div>

        <div className="days-grid">
        {draft.schedule.map((d) => (
          <div key={d.day} className="day-block">
            <div className="day-header">
              <h3>Ngày {d.day}</h3>
              {draft.schedule.length > 1 && (
                <button className="chip" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => removeDay(d.day)}>
                  Xoá ngày
                </button>
              )}
            </div>
            <div className="card stack">
              {d.stops.length === 0 && <div className="muted">Chưa có điểm nào.</div>}
              {d.stops.map((s, i) => (
                <div key={`${s.place.id}-${i}`} className="stop">
                  <div className="time">{s.startTime}</div>
                  <div className="body" onClick={() => navigate(`/place/${s.place.id}`)}>
                    <div className="name">
                      {categoryIcon(s.place.category)} {s.place.name}
                    </div>
                    {s.note && <div className="muted">{s.note}</div>}
                  </div>
                  <div className="actions">
                    <button className="icon-btn" aria-label="Lên" disabled={i === 0} onClick={() => moveStop(d.day, i, -1)}>
                      ↑
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Xuống"
                      disabled={i === d.stops.length - 1}
                      onClick={() => moveStop(d.day, i, 1)}
                    >
                      ↓
                    </button>
                    <button className="icon-btn" aria-label="Xoá" onClick={() => removeStop(d.day, i)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <Button size="small" variant="tertiary" onClick={() => navigate(`/places?day=${d.day}`)}>
                + Thêm điểm vào ngày {d.day}
              </Button>
              {d.stops.length > 0 && (
                <Button
                  size="small"
                  variant="tertiary"
                  onClick={() => openLink(dayRouteUrl(d.stops.map((s) => s.place))!)}
                >
                  🧭 Chỉ đường cả ngày {d.day}
                </Button>
              )}
              {d.stops.length > MAX_WAYPOINTS + 1 && (
                <div className="muted">Google Maps chỉ nhận tối đa {MAX_WAYPOINTS} điểm dừng chen giữa, nên một số điểm sẽ không có trong lộ trình.</div>
              )}
            </div>
          </div>
        ))}
        </div>

        {draft.schedule.length < 7 && (
          <Button className="add-day" fullWidth variant="secondary" onClick={addDay}>
            + Thêm ngày
          </Button>
        )}
      </div>
    </Screen>
  );
}
