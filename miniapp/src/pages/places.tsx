import React, { useEffect, useState } from "react";
import { Button, useNavigate, useSearchParams, useSnackbar } from "zmp-ui";
import { Loading, Screen } from "../components/layout";
import { PlaceCard } from "../components/place-card";
import { api } from "../lib/api";
import { useDraft } from "../state/draft";
import { PLACE_CATEGORIES, type Place } from "../types";

export default function PlacesPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [params, setParams] = useSearchParams();
  const { draft, addStop } = useDraft();
  const category = params.get("category") ?? "";
  // Có ?day=N nghĩa là đang chọn điểm để thêm vào ngày N của lịch
  const day = Number(params.get("day")) || undefined;
  const [places, setPlaces] = useState<Place[] | null>(null);

  useEffect(() => {
    setPlaces(null);
    api
      .places(category || undefined)
      .then(setPlaces)
      .catch((e) => {
        setPlaces([]);
        openSnackbar({ text: (e as Error).message, type: "error" });
      });
  }, [category]);

  const setCategory = (id: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set("category", id);
    else next.delete("category");
    setParams(next, { replace: true });
  };

  const inDraft = new Set(draft?.schedule.flatMap((d) => d.stops.map((s) => s.place.id)) ?? []);

  const add = (place: Place) => {
    if (!day) return;
    addStop(day, place);
    openSnackbar({ text: `Đã thêm vào ngày ${day}`, type: "success" });
    navigate(-1);
  };

  return (
    <Screen title={day ? `Thêm điểm vào ngày ${day}` : "Điểm đến"}>
      <div className="content">
        <div className="chips" style={{ marginBottom: 14 }}>
          <button className={`chip ${!category ? "active" : ""}`} onClick={() => setCategory("")}>
            Tất cả
          </button>
          {PLACE_CATEGORIES.map((c) => (
            <button key={c.id} className={`chip ${category === c.id ? "active" : ""}`} onClick={() => setCategory(c.id)}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {!places && <Loading />}
        {places?.length === 0 && <div className="empty">Chưa có điểm đến nào.</div>}
        <div className="stack">
          {places?.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              onClick={() => navigate(`/place/${p.id}${day ? `?day=${day}` : ""}`)}
              action={
                day && (
                  <div onClick={(e) => e.stopPropagation()} style={{ alignSelf: "center" }}>
                    <Button size="small" variant={inDraft.has(p.id) ? "tertiary" : "primary"} onClick={() => add(p)}>
                      {inDraft.has(p.id) ? "Đã có" : "Thêm"}
                    </Button>
                  </div>
                )
              }
            />
          ))}
        </div>
      </div>
    </Screen>
  );
}
