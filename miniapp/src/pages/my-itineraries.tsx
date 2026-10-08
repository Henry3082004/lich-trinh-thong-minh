import React, { useEffect, useState } from "react";
import { Button, useNavigate, useSnackbar } from "zmp-ui";
import { Loading, Screen } from "../components/layout";
import { api } from "../lib/api";
import { useDraft } from "../state/draft";
import type { Itinerary } from "../types";

export default function MyItinerariesPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { draft, fromItinerary, clear } = useDraft();
  const [list, setList] = useState<Itinerary[] | null>(null);

  useEffect(() => {
    api
      .myItineraries()
      .then(setList)
      .catch((e) => {
        setList([]);
        openSnackbar({ text: (e as Error).message, type: "error" });
      });
  }, []);

  const open = (it: Itinerary) => {
    fromItinerary(it);
    navigate("/editor");
  };

  const remove = async (it: Itinerary) => {
    if (!window.confirm(`Xoá "${it.title}"?`)) return;
    try {
      await api.remove(it.id);
      setList((l) => l?.filter((x) => x.id !== it.id) ?? null);
      if (draft?.id === it.id) clear();
    } catch (e) {
      openSnackbar({ text: (e as Error).message, type: "error" });
    }
  };

  return (
    <Screen title="Lịch của tôi">
      <div className="content stack card-grid">
        {!list && <Loading />}
        {list?.length === 0 && (
          <div className="empty">
            <p>Bạn chưa lưu lịch trình nào.</p>
            <Button onClick={() => navigate("/create")}>Tạo lịch trình</Button>
          </div>
        )}
        {list?.map((it) => (
          <div key={it.id} className="card row" style={{ justifyContent: "space-between" }}>
            <div style={{ flex: 1, cursor: "pointer" }} onClick={() => open(it)}>
              <div style={{ fontWeight: 600 }}>{it.title}</div>
              <div className="muted">
                {it.days} ngày · {it.items.length} điểm · {new Date(it.updatedAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
            <button className="icon-btn" aria-label="Xoá" onClick={() => remove(it)}>
              🗑
            </button>
          </div>
        ))}
      </div>
    </Screen>
  );
}
