import React from "react";
import { Button, useNavigate } from "zmp-ui";
import { Screen } from "../components/layout";
import { dayRouteUrl, MAX_WAYPOINTS } from "../lib/maps";
import { formatDuration } from "../lib/schedule";
import { openLink } from "../lib/zalo";
import { useDraft } from "../state/draft";
import { categoryIcon } from "../types";

export default function EditorPage() {
  const navigate = useNavigate();
  const { draft, setTitle, moveStop, removeStop, addDay, removeDay } = useDraft();

  if (!draft) {
    return (
      <Screen title="Chỉnh lịch">
        <div className="empty">
          <p>Chưa có lịch trình nào đang chỉnh.</p>
          <Button onClick={() => navigate("/create", { replace: true })}>Tạo lịch trình</Button>
        </div>
      </Screen>
    );
  }

  const isEmpty = draft.schedule.every((d) => d.stops.length === 0);

  return (
    <Screen
      title="Chỉnh lịch"
      bottom={
        <button className="btn-primary btn-lg" disabled={isEmpty} onClick={() => navigate("/poster", { replace: true })}>
          Xong, cập nhật ảnh
        </button>
      }
    >
      <div className="content">
        <div className="editor-head">
          <input className="title-input" value={draft.title} maxLength={60} onChange={(e) => setTitle(e.target.value)} aria-label="Tên lịch trình" />
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
                  <button className="pill-btn" onClick={() => removeDay(d.day)}>
                    Xoá ngày
                  </button>
                )}
              </div>
              <div className="stack" style={{ gap: 10 }}>
                {d.stops.length === 0 && <div className="muted">Chưa có điểm nào.</div>}
                {d.stops.map((s, i) => (
                  <div key={`${s.place.id}-${i}`} className="edit-stop">
                    <div className="edit-thumb" onClick={() => navigate(`/place/${s.place.id}`)}>
                      {s.place.images[0] ? <img src={s.place.images[0]} alt="" loading="lazy" /> : categoryIcon(s.place.category)}
                    </div>
                    <div className="edit-body" onClick={() => navigate(`/place/${s.place.id}`)}>
                      <div className="row" style={{ gap: 6 }}>
                        <span className="time-pill">{s.startTime}</span>
                        <span className="muted">{formatDuration(s.place.durationMin)}</span>
                      </div>
                      <div className="edit-name">{s.place.name}</div>
                      {s.note && <div className="muted">{s.note}</div>}
                    </div>
                    <div className="edit-arrows">
                      <button aria-label="Lên" disabled={i === 0} onClick={() => moveStop(d.day, i, -1)}>
                        ▲
                      </button>
                      <button aria-label="Xuống" disabled={i === d.stops.length - 1} onClick={() => moveStop(d.day, i, 1)}>
                        ▼
                      </button>
                    </div>
                    <button className="edit-remove" aria-label="Xoá" onClick={() => removeStop(d.day, i)}>
                      ✕
                    </button>
                  </div>
                ))}
                <button className="add-stop" onClick={() => navigate(`/places?day=${d.day}`)}>
                  + Thêm điểm đến vào ngày {d.day}
                </button>
                {d.stops.length > 0 && (
                  <button className="btn-text" onClick={() => openLink(dayRouteUrl(d.stops.map((s) => s.place))!)}>
                    🧭 Chỉ đường cả ngày {d.day}
                  </button>
                )}
                {d.stops.length > MAX_WAYPOINTS + 1 && (
                  <div className="muted">Google Maps chỉ nhận tối đa {MAX_WAYPOINTS} điểm dừng chen giữa, nên một số điểm sẽ không có trong lộ trình.</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {draft.schedule.length < 7 && (
          <button className="add-stop add-day" onClick={addDay}>
            + Thêm ngày
          </button>
        )}
      </div>
    </Screen>
  );
}
