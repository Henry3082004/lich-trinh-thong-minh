# lich-trinh-thong-minh

Zalo Mini App giúp khách tạo lịch trình du lịch Đắk Song, phục vụ cổng du lịch Đắk Song.

```
├── backend/   API Node.js + TypeScript + Prisma (Postgres), deploy Railway
├── docs/      api.md: hợp đồng API giữa mini app và backend
└── miniapp/   Zalo Mini App (React + zmp-ui + zmp-sdk, Vite)
```

## Mini app: chạy và deploy

Yêu cầu: Node 20+, `zmp-cli` (`npm i -g zmp-cli`), tài khoản Zalo Developer có quyền với mini app.

```bash
cd miniapp
cp .env.example .env     # VITE_API_BASE_URL = URL backend Railway
npm install
npm start                # http://localhost:5173, xem trên trình duyệt (để kiểu điện thoại)
```

- `VITE_USE_MOCK=true` chạy hoàn toàn bằng dữ liệu giả, không cần backend.
- Chạy ngoài app Zalo thì "Lưu ảnh" tải file `.png` xuống, "Chia sẻ" dùng chia sẻ của trình duyệt, và đăng nhập dùng header `X-Dev-User`. Vì vậy backend phải đang chạy `AUTH_MODE=dev`.
- Trong app Zalo, app dùng `getAccessToken`, `saveImageToGallery`, `openShareSheet`, `openWebview` của `zmp-sdk`. **Lưu ảnh chỉ chạy trên điện thoại thật.**

Deploy lên Zalo:
```bash
zmp login                # đăng nhập tài khoản Zalo Developer
npm run deploy:testing   # bản Testing, chỉ tester thấy
npm run deploy:dev       # bản Development
```
Lần đầu `zmp-cli` sẽ hỏi App ID của mini app. Nếu lệnh trên báo lỗi với project có sẵn, chạy `zmp deploy` và làm theo hướng dẫn.

Màn hình: Trang chủ → Tạo lịch (số ngày, sở thích, nhịp độ) → Chỉnh lịch (↑↓, xoá, thêm điểm, thêm ngày, Lưu) → Ảnh lịch trình (Lưu ảnh / Chia sẻ). Thêm "Lịch của tôi", "Điểm đến", chi tiết điểm đến.

Đổi màu: `miniapp/src/theme.css` (biến `--green-*` và `--zaui-light-*`) và `app-config.json` (`headerColor`).

## Backend: chạy local

Yêu cầu: Node 20+, Postgres.

```bash
cd backend
cp .env.example .env          # sửa DATABASE_URL nếu cần
npm install
npx prisma migrate dev        # tạo bảng
npm run seed                  # nạp điểm đến từ data/places.json
npm run dev                   # http://localhost:3000
```

Thử nhanh:
```bash
curl localhost:3000/api/places
curl -X POST localhost:3000/api/suggest -H 'content-type: application/json' \
  -d '{"days":2,"interests":["van-hoa"],"pace":"normal"}'
curl localhost:3000/api/itineraries -H 'X-Dev-User: test'
```

Test: `npm test` (cần database `daksong_test`, hoặc đặt `TEST_DATABASE_URL`). Test sẽ **xoá sạch** dữ liệu trong database đó.

## Nội dung điểm đến

`backend/data/places.json` hiện chỉ có **dữ liệu mẫu** (tên `[Mẫu] ...`, toạ độ giả). Thay bằng nội dung thật từ cổng du lịch Đắk Song rồi chạy `npm run seed`. Seed cập nhật theo `slug`. Điểm mẫu cũ không tự bị xoá, nên phải xoá thủ công khi chuyển sang dữ liệu thật.

Các trường quan trọng cho thuật toán gợi ý: `category`, `tags`, `lat`, `lng`, `durationMin` (phút tham quan).

## Deploy Railway

`backend/railway.json` đã cấu hình build/start. Trên Railway:
1. Tạo project, thêm **Postgres**.
2. Thêm service từ repo GitHub, **Root Directory = `backend`**.
3. Biến môi trường: `DATABASE_URL` (tham chiếu tới Postgres), `AUTH_MODE=zalo` (hoặc `dev` khi demo), `CORS_ORIGIN`.
4. Generate domain, kiểm tra `https://<domain>/health`.

Khi khởi động, service tự chạy migration và seed.
