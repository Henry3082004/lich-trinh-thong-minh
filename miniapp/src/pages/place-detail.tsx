import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useSnackbar } from "zmp-ui";
import { Loading, Screen } from "../components/layout";
import { AddButton } from "../components/add-button";
import { PlaceThumb, PlaceImg } from "../components/place-card";
import { api } from "../lib/api";
import { formatDuration } from "../lib/schedule";
import { directionsUrl } from "../lib/maps";
import { callPhone, openLink } from "../lib/zalo";
import { useDraft } from "../state/draft";
import { categoryName, type GoogleInfo, type Place } from "../types";
import { CatIcon } from "../components/icons";
import {
  IconCalendarEvent,
  IconCalendarTime,
  IconChevronLeft,
  IconClock,
  IconExternalLink,
  IconInfoCircle,
  IconMap2,
  IconMapPin,
  IconNavigation,
  IconPhone,
  IconWallet,
} from "@tabler/icons-react";

export default function PlaceDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const go = (url: string) => openLink(url).catch((e) => openSnackbar({ text: (e as Error).message || "Chưa mở được bản đồ", type: "error" }));
  const { draft, addStop } = useDraft();
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState("");
  const [google, setGoogle] = useState<GoogleInfo | null>(null);
  const presetDay = Number(params.get("day")) || undefined;

  useEffect(() => {
    setGoogle(null);
    api.placeGoogle(id).then(setGoogle);
    api.place(id).then(setPlace).catch((e) => setError((e as Error).message));
  }, [id]);

  const add = (day: number) => {
    if (!place) return;
    addStop(day, place);
    openSnackbar({ text: `Đã thêm vào ngày ${day}`, type: "success" });
    // Đến từ "Thêm điểm" của Editor (Editor → Places → đây) thì quay về đúng Editor cũ
    if (presetDay) navigate(-2);
    else navigate("/editor");
  };


  return (
    <Screen
      cart={!presetDay}
      bottom={
        place ? (
          presetDay && draft ? (
            <div className="bottom-stack">
              <div className="chips" style={{ justifyContent: "center" }}>
                {draft.schedule.map((d) => (
                  <button key={d.day} className={`chip ${presetDay === d.day ? "active" : ""}`} onClick={() => add(d.day)}>
                    Thêm vào ngày {d.day}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bottom-stack" data-tour="add">
              <AddButton place={place} size="lg" />
            </div>
          )
        ) : undefined
      }
    >
      <button className="round-back" aria-label="Quay lại" onClick={() => navigate(-1)}>
        <IconChevronLeft size={24} stroke={2} />
      </button>
      {error && <div className="empty">{error}</div>}
      {!place && !error && <Loading />}
      {place && (
        <div className="detail">
          <div className="detail-hero">
            <PlaceImg key={place.id} place={place} alt={place.name} lazy={false} fallback={<PlaceThumb place={place} />} />
            <div className="detail-hero-shade" />
          </div>
          <div className="detail-sheet content narrow stack">
            <div className="d-tags">
              <span className="p-tag d-tag">
                <CatIcon category={place.category} size={16} />
                {categoryName(place.category)}
              </span>
              <span className="d-tag earth">
                <IconClock size={16} stroke={2} aria-hidden />
                khoảng {formatDuration(place.durationMin)}
              </span>
            </div>
            <div className="d-title">
              <h2 className="detail-name">{place.name}</h2>
              {place.address && (
                <div className="detail-addr">
                  <IconMapPin size={18} stroke={2} aria-hidden />
                  {place.address}
                </div>
              )}
            </div>
            <div className="d-facts">
              {(place.season || place.months.length > 0) && (
                <div className="d-fact">
                  <span className="d-fact-ico">
                    <IconCalendarEvent size={20} stroke={2} />
                  </span>
                  <div>
                    <span>Thời gian diễn ra</span>
                    <b>{place.season || `Tháng ${place.months.join(", ")}`}</b>
                  </div>
                </div>
              )}
              <div className="d-fact">
                <span className="d-fact-ico">
                  <IconWallet size={20} stroke={2} />
                </span>
                <div>
                  <span>Giá tham khảo</span>
                  <b>{place.priceNote || "Đang cập nhật"}</b>
                </div>
              </div>
              <div className="d-fact">
                <span className="d-fact-ico">
                  <IconCalendarTime size={20} stroke={2} />
                </span>
                <div>
                  <span>Giờ mở cửa</span>
                  <b>{place.openHours || "Đang cập nhật"}</b>
                </div>
              </div>
            </div>
            <div className="d-intro">
              <h3>Giới thiệu</h3>
              <p className="detail-desc">{place.description}</p>
            </div>
            <div className="detail-actions">
              {place.phone && (
                <button className="btn-outline d-wide" onClick={() => callPhone(place.phone!)}>
                  <IconPhone size={20} stroke={2} aria-hidden />
                  Gọi {place.phone}
                </button>
              )}
              <button className="btn-outline" onClick={() => go(directionsUrl(place))}>
                <IconNavigation size={20} stroke={2} aria-hidden />
                Chỉ đường
              </button>
              {place.mapLink && (
                <button className="btn-outline" onClick={() => go(place.mapLink!)}>
                  <IconMap2 size={20} stroke={2} aria-hidden />
                  Xem trên Google Maps
                </button>
              )}
            </div>
            {place.approxLocation && (
              <div className="muted d-note">
                <IconInfoCircle size={16} stroke={2} aria-hidden />
                Chỉ đường sẽ tìm theo tên địa điểm trên Google Maps.
              </div>
            )}
            {place.imageCredits.length > 0 && <div className="muted" style={{ fontSize: 13 }}>Ảnh: {place.imageCredits.join("; ")}</div>}

            {google && (google.rating !== null || google.reviews.length > 0) && (
              <div className="g-reviews">
                <button className="g-summary" onClick={() => go(google.reviewsUrl)}>
                  {google.rating !== null && (
                    <>
                      <b className="g-score">★ {google.rating.toFixed(1)}</b>
                      <span>{google.ratingCount.toLocaleString("vi-VN")} đánh giá trên Google</span>
                    </>
                  )}
                  <IconExternalLink className="g-go" size={18} stroke={2} aria-hidden />
                </button>
                {google.reviews.map((r, i) => (
                  <div key={i} className="g-review">
                    <div className="g-head">
                      <b>{r.author}</b>
                      <span className="g-stars" aria-label={`${r.rating} sao`}>
                        {"★".repeat(Math.round(r.rating))}
                      </span>
                      {r.when && <span className="muted">{r.when}</span>}
                    </div>
                    <div className="g-text">{r.text}</div>
                  </div>
                ))}
                <button className="btn-outline" onClick={() => go(google.reviewsUrl)}>
                  Xem tất cả đánh giá trên Google Maps
                  <IconExternalLink size={18} stroke={2} aria-hidden />
                </button>
                <div className="muted" style={{ textAlign: "center", fontSize: 12 }}>
                  Nguồn: {google.source}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Screen>
  );
}
