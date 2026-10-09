import React, { useEffect, useState } from "react";
import { Button, useNavigate, useSearchParams, useSnackbar } from "zmp-ui";
import { Loading, Screen } from "../components/layout";
import { PlaceCard } from "../components/place-card";
import { api } from "../lib/api";
import { useDraft } from "../state/draft";
import { useCart } from "../state/cart";
import { PLACE_CATEGORIES, type Place } from "../types";
import { findCollection } from "../lib/collections";
import { IconListCheck, IconMapSearch, IconSearch, IconX } from "@tabler/icons-react";
import { CatIcon } from "../components/icons";

export default function PlacesPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [params, setParams] = useSearchParams();
  const { draft, addStop } = useDraft();
  const { has: inCart, count: cartCount } = useCart();
  const category = params.get("category") ?? "";
  const collection = findCollection(params.get("collection"));
  // Có ?day=N nghĩa là đang chọn điểm để thêm vào ngày N của lịch
  const day = Number(params.get("day")) || undefined;
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [query, setQuery] = useState(() => params.get("q") ?? "");

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
    <Screen
      title={day ? `Thêm điểm vào ngày ${day}` : collection ? collection.title : "Điểm đến"}
      bottom={
        !day && cartCount > 0 ? (
          <button className="btn-primary btn-lg" data-tour="cart" onClick={() => navigate("/cart")}>
            <IconListCheck size={20} stroke={2} aria-hidden />
            Xem lịch trình ({cartCount})
          </button>
        ) : undefined
      }
    >
      <div className="content">
        <label className="search-field">
          <IconSearch size={20} stroke={2} aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm thác, quán ăn, homestay…" aria-label="Tìm điểm đến" />
        </label>
        <div className="chip-scroll">
          <button className={`chip ${!category && !collection ? "active" : ""}`} onClick={() => setCategory("")}>
            <CatIcon category="" size={18} />
            Tất cả
          </button>
          {PLACE_CATEGORIES.map((c) => (
            <button key={c.id} className={`chip ${category === c.id ? "active" : ""}`} onClick={() => setCategory(c.id)}>
              <CatIcon category={c.id} size={18} />
              {c.name}
            </button>
          ))}
        </div>

        {collection && (
          <div className="collection-head">
            <div>
              <b>
                <collection.icon size={20} stroke={2} aria-hidden /> {collection.title}
              </b>
              <div className="muted">{collection.desc}</div>
            </div>
            <button className="btn-round" aria-label="Bỏ lọc" onClick={() => setCategory("")}>
              <IconX size={20} stroke={2} />
            </button>
          </div>
        )}
        {!places && <Loading />}
        {places && shown.length > 0 && <div className="p-count">{shown.length} địa điểm</div>}
        {places && shown.length === 0 && (
          <div className="empty p-empty">
            <IconMapSearch size={32} stroke={2} aria-hidden />
            {query ? "Không tìm thấy điểm đến nào." : "Chưa có điểm đến nào trong nhóm này."}
          </div>
        )}
        <div className="stack card-grid">
          {shown.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              added={!day && inCart(p.id)}
              // Chạm vào điểm là mở trang thông tin (có nút thêm vào lịch trình)
              onClick={() => navigate(day ? `/place/${p.id}?day=${day}` : `/place/${p.id}`)}
              action={
                day ? (
                  <div onClick={(e) => e.stopPropagation()} style={{ alignSelf: "center" }}>
                    <Button size="small" variant={inDraft.has(p.id) ? "tertiary" : "primary"} onClick={() => add(p)}>
                      {inDraft.has(p.id) ? "Đã có" : "Thêm"}
                    </Button>
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>
      </div>
    </Screen>
  );
}
