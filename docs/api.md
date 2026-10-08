# API: Mini app lịch trình du lịch Đắk Song

Đây là hợp đồng giữa mini app (frontend) và backend. Frontend có thể dựng màn hình bằng dữ liệu giả theo đúng các mẫu JSON dưới đây, rồi đổi sang API thật bằng cách đặt `API_BASE_URL`.

- Base URL (local): `http://localhost:3000`
- Base URL (Railway): `https://<domain>.up.railway.app` (điền khi deploy xong)
- Mọi body và response đều là JSON. Lỗi trả về `{ "error": "..." }` kèm mã HTTP (400, 401, 403, 404, 500).

## Xác thực

Các API `/api/itineraries*` cần biết người dùng là ai:

```
Authorization: Bearer <access token lấy từ zmp-sdk getAccessToken()>
```

Khi test chưa có mini app (backend chạy `AUTH_MODE=dev`), dùng header `X-Dev-User: <tên bất kỳ>` thay cho token.

## Kiểu dữ liệu

### Place (điểm đến)
```json
{
  "id": "cm1abc...",
  "slug": "mau-thien-nhien-1",
  "name": "[Mẫu] Thiên nhiên 1",
  "category": "thien-nhien",
  "description": "PLACEHOLDER – thay bằng nội dung thật...",
  "images": ["https://.../anh.jpg"],
  "lat": 12.25,
  "lng": 107.62,
  "address": null,
  "tags": ["thien-nhien", "check-in"],
  "durationMin": 120,
  "openHours": null,
  "sourceUrl": null,
  "phone": "0981302444",
  "mapLink": "https://goo.gl/maps/..."
}
```
`phone` và `mapLink` có thể là `null`. Danh mục `category`: `thien-nhien`, `van-hoa`, `am-thuc`, `trai-nghiem`, `luu-tru`.

## Endpoint

### `GET /health`
→ `{ "status": "ok" }`

### `GET /api/categories`
→ `[{ "id": "thien-nhien", "name": "Thiên nhiên" }, ...]`

### `GET /api/places?category=van-hoa&tag=check-in`
Cả hai tham số đều tuỳ chọn. → `Place[]`

### `GET /api/places/:idOrSlug`
→ `Place`, hoặc 404.

### `POST /api/suggest`: gợi ý lịch trình (không lưu)
Body:
```json
{ "days": 2, "interests": ["van-hoa", "thien-nhien"], "pace": "normal" }
```
- `days`: 1–7
- `interests`: danh mục hoặc tag; mảng rỗng = không ưu tiên gì
- `pace`: `relaxed` (≤3 điểm/ngày), `normal` (≤4), `packed` (≤5). Mặc định `normal`.

Response:
```json
{
  "days": 2,
  "interests": ["van-hoa"],
  "pace": "normal",
  "schedule": [
    {
      "day": 1,
      "totalMinutes": 364,
      "stops": [
        { "placeId": "cm1...", "order": 1, "startTime": "08:00", "travelMinFromPrev": 0, "place": { "...Place" } },
        { "placeId": "cm2...", "order": 2, "startTime": "09:40", "travelMinFromPrev": 10, "place": { "...Place" } }
      ]
    }
  ]
}
```
> Nếu hết điểm đến, `schedule` có thể ít ngày hơn `days` yêu cầu. Frontend dùng `schedule.length` để biết số ngày thực tế.

Mỗi ngày bắt đầu 08:00. Có 1 điểm ẩm thực chèn vào giữa ngày nếu còn. Các điểm gần nhau được gom cùng ngày.

### `GET /api/itineraries` 🔒
→ danh sách lịch trình của người dùng hiện tại (mới nhất trước), kèm `items`.

### `POST /api/itineraries` 🔒
Body (ví dụ lưu từ kết quả gợi ý):
```json
{
  "title": "Đắk Song 2 ngày",
  "days": 2,
  "interests": ["van-hoa"],
  "items": [
    { "day": 1, "order": 1, "placeId": "cm1...", "startTime": "08:00", "note": "Mang áo mưa" },
    { "day": 1, "order": 2, "placeId": "cm2..." }
  ]
}
```
→ 201 + Itinerary:
```json
{
  "id": "cm9...",
  "userId": "cm8...",
  "title": "Đắk Song 2 ngày",
  "days": 2,
  "interests": ["van-hoa"],
  "shareId": "Xy12abCd34Q",
  "createdAt": "2026-10-07T09:00:00.000Z",
  "updatedAt": "2026-10-07T09:00:00.000Z",
  "items": [
    { "id": "...", "itineraryId": "cm9...", "day": 1, "order": 1, "placeId": "cm1...", "startTime": "08:00", "note": "Mang áo mưa", "place": { "...Place" } }
  ]
}
```

### `GET /api/itineraries/:id` 🔒
→ Itinerary. Trả 403 nếu lịch không phải của bạn, 404 nếu không tồn tại.

### `PUT /api/itineraries/:id` 🔒
Body giống POST, **thay toàn bộ** tiêu đề và danh sách điểm. → Itinerary.

### `DELETE /api/itineraries/:id` 🔒
→ 204.

### `GET /api/share/:shareId`: xem lịch được chia sẻ (công khai, chỉ đọc)
→ Itinerary, không có `userId`.

### `GET /api/img?u=<địa chỉ ảnh>`: proxy ảnh
Máy chủ ảnh của cổng (`static.dggv.edu.vn`) không có CORS nên trình duyệt không cho vẽ ảnh đó vào poster. Backend lấy ảnh rồi trả lại kèm CORS.
- Chỉ nhận địa chỉ `https` thuộc các máy chủ trong `IMAGE_HOSTS` (mặc định `static.dggv.edu.vn`). Địa chỉ IP, cổng lạ, địa chỉ có tài khoản, chuyển hướng đều bị từ chối.
- → ảnh (`image/jpeg`, `image/png`, `image/webp` hoặc `image/gif`, nhận dạng bằng byte đầu của file), `Cache-Control: public, max-age=86400`.
- Lỗi: 400 địa chỉ sai, 403 máy chủ không được phép, 413 ảnh quá 5 MB, 415 không phải ảnh, 429 gọi quá nhanh (240 lần/phút/IP), 502 máy chủ ảnh lỗi.

### `POST /api/posters` 🔒: lưu ảnh lịch trình để chia sẻ
Body là **ảnh thô** (không phải JSON), `Content-Type: image/jpeg` hoặc `image/png`, từ 1 KB đến 2 MB. Loại ảnh được kiểm tra bằng byte đầu của file chứ không tin header.
→ 201
```json
{ "id": "NfS5LHeJmmikZLoU", "url": "https://<api>/api/posters/NfS5LHeJmmikZLoU.jpg" }
```
Giới hạn mặc định 30 lần/giờ/người dùng. Ảnh tự xoá sau 30 ngày (`POSTER_TTL_DAYS`). Lỗi: 401, 413, 415, 429.

### `GET /api/posters/:id.jpg|png`: mở ảnh đã lưu (công khai)
Trả ảnh. `id` dài, không đoán được nên chỉ người có link mới xem được. 404 nếu không có, đã hết hạn hoặc sai đuôi file.
Link này được dùng cho `openShareSheet({ type: "image", data: { imageUrls: [url] } })` của `zmp-sdk`.

## Ví dụ gọi từ mini app

```js
const API = import.meta.env.VITE_API_BASE_URL; // vd. https://xxx.up.railway.app
import { getAccessToken } from "zmp-sdk/apis";

async function api(path, options = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.status === 204 ? null : res.json();
}

const goiY = await api("/api/suggest", { method: "POST", body: JSON.stringify({ days: 2, interests: ["van-hoa"] }) });
```
