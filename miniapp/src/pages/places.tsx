import React, { useEffect, useState } from "react";
import { Button, useNavigate, useSearchParams, useSnackbar } from "zmp-ui";
import { Loading, Screen } from "../components/layout";
import { PlaceCard } from "../components/place-card";
import { api } from "../lib/api";
import { useDraft } from "../state/draft";
import { useCart } from "../state/cart";
import { PLACE_CATEGORIES, type Place } from "../types";
import { findCollection } from "../lib/collections";

export default function PlacesPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [params, setParams] = useSearchParams();
  const { draft, addStop } = useDraft();
  const { has: inCart } = useCart();
  const category = params.get("category") ?? "";
  const collection = findCollection(params.get("collection"));
  // Có ?day=N nghĩa là đang chọn điểm để thêm vào ngày N của lịch
  const day = Number(params.get("day")) || undefined;
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setPlaces(null);
    api
      .places(collection ? undefined : category || undefined)
      .then((all) => {
        if (!collection) return setPlaces(all);
        const list = all.filter(collection.match);
        setPlaces(collection.sort ? [...list].sort(collection.sort) : list);
      })
      .catch((e) => {
        setPlaces([]);
        openSnackbar({ text: (e as Error).message, type: "error" });
      });
  }, [category, collection?.id]);

  const setCategory = (id: string) => {
    const next = new URLSearchParams(params);
    next.delete("collection");
    if (id) next.set("category", id);
    else next.delete("category");
    setParams(next, { replace: true });
  };

  const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
  const shown = (places ?? []).filter((p) => !query.trim() || norm(`${p.name} ${p.address ?? ""}`).includes(norm(query.trim())));

  const inDraft = new Set(draft?.schedule.flatMap((d) => d.stops.map((s) => s.place.id)) ?? []);

  const add = (place: Place) => {
    if (!day) return;
    addStop(day, place);
    openSnackbar({ text: `Đã thêm vào ngày ${day}`, type: "success" });
    navigate(-1);
  };

  return (
    <Screen title={day ? `Thêm điểm vào ngày ${day}` : collection ? collection.title : "Điểm đến"} cart={!day}>
      <div className="content">
        <label className="search-field">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm thác, quán ăn, homestay…" aria-label="Tìm điểm đến" />
        </label>
        <div className="chip-scroll">
          <button className={`chip ${!category && !collection ? "active" : ""}`} onClick={() => setCategory("")}>
            Tất cả
          </button>
          {PLACE_CATEGORIES.map((c) => (
            <button key={c.id} className={`chip ${category === c.id ? "active" : ""}`} onClick={() => setCategory(c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        {collection && (
          <div className="collection-head">
            <div>
              <b>
                {collection.icon} {collection.title}
              </b>
              <div className="muted">{collection.desc}</div>
            </div>
            <button className="btn-round" aria-label="Bỏ lọc" onClick={() => setCategory("")}>
              ✕
            </button>
          </div>
        )}
        {!places && <Loading />}
        {places && shown.length === 0 && <div className="empty">{query ? "Không tìm thấy điểm đến nào." : "Chưa có điểm đến nào."}</div>}
        <div className="stack card-grid">
          {shown.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              // Chạm vào điểm là mở trang thông tin (có nút thêm vào lịch trình)
              onClick={() => navigate(day ? `/place/${p.id}?day=${day}` : `/place/${p.id}`)}
              action={
                day ? (
                  <div onClick={(e) => e.stopPropagation()} style={{ alignSelf: "center" }}>
                    <Button size="small" variant={inDraft.has(p.id) ? "tertiary" : "primary"} onClick={() => add(p)}>
                      {inDraft.has(p.id) ? "Đã có" : "Thêm"}
                    </Button>
                  </div>
                ) : inCart(p.id) ? (
                  <span className="in-cart-badge static">✓ Đã thêm</span>
                ) : undefined
              }
            />
          ))}
        </div>
      </div>
    </Screen>
  );
}
