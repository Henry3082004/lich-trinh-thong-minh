import React, { useEffect, useState } from "react";
import { useNavigate, useSnackbar } from "zmp-ui";
import { Loading, Screen } from "../components/layout";
import { api } from "../lib/api";
import { useDraft } from "../state/draft";
import type { Itinerary } from "../types";
import { IconMap, IconTrash } from "@tabler/icons-react";

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
    navigate("/poster");
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
            <button className="btn-primary btn-lg" onClick={() => navigate("/create")}>
              Tạo lịch trình
            </button>
          </div>
        )}
        {list?.map((it) => (
          <div key={it.id} className="saved-card">
            <div className="saved-thumb" onClick={() => open(it)}>
              {it.items[0]?.place.images[0] ? <img src={it.items[0].place.images[0]} alt="" loading="lazy" /> : <IconMap size={28} stroke={1.75} aria-hidden />}
            </div>
            <div className="saved-body">
              <div className="saved-title" onClick={() => open(it)}>
                {it.title}
              </div>
              <div className="muted">
                {it.days} ngày · {it.items.length} điểm · Lưu ngày {new Date(it.updatedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
              </div>
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <button className="btn-primary btn-sm" onClick={() => open(it)}>
                  Mở ảnh
                </button>
                <button className="btn-round" aria-label="Xoá" onClick={() => remove(it)}>
                  <IconTrash size={20} stroke={2} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
