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

- **Giao diện theo thiết bị** (`src/index.html` + `src/theme.css`, thuộc tính `html[data-layout]`, tự cập nhật khi xoay máy hoặc mở/gập điện thoại gập): `phone` (điện thoại, màn hình ngoài của điện thoại gập), `tablet` (máy tính bảng, điện thoại gập khi mở ra, cạnh ngắn ≥ 600px; hai cột, màn ảnh poster chia đôi), `desktop` (máy tính dùng chuột, cửa sổ ≥ 900px). Ép thử bằng `?layout=phone|tablet|desktop`.
- `VITE_USE_MOCK=true` chạy hoàn toàn bằng dữ liệu giả, không cần backend.
- Chạy ngoài app Zalo thì "Lưu ảnh" tải file `.png` xuống, "Chia sẻ" dùng chia sẻ của trình duyệt, và đăng nhập dùng header `X-Dev-User`. Vì vậy backend phải đang chạy `AUTH_MODE=dev`.
- Nút "Xem thêm trên cổng du lịch" mở `https://dulichdaksong.vnasw.vn` (đổi bằng `VITE_PORTAL_URL`). Trong app Zalo nó mở bằng `openWebview`, nên tên miền này có thể cần được khai báo trong cài đặt mini app.
- Trong app Zalo, app dùng `getAccessToken`, `saveImageToGallery`, `openShareSheet`, `openWebview` của `zmp-sdk`. **Lưu ảnh chỉ chạy trên điện thoại thật.**

Deploy lên Zalo:
```bash
zmp login                # đăng nhập tài khoản Zalo Developer
npm run deploy:testing   # bản Testing, chỉ tester thấy
npm run deploy:dev       # bản Development
```
Lần đầu `zmp-cli` sẽ hỏi App ID của mini app. Nếu lệnh trên báo lỗi với project có sẵn, chạy `zmp deploy` và làm theo hướng dẫn.

Luồng chính (2 chạm là ra ảnh): Trang chủ → **Tạo ảnh lịch trình** → chọn số ngày (có sẵn mặc định, sở thích là tuỳ chọn) → **Tạo ảnh** → màn ảnh (`/poster`): đổi tên chuyến đi, đổi giữa 3 mẫu (Rừng xanh, Hoàng hôn, Tối giản), **Lưu ảnh** hoặc **Gửi qua Zalo**. Từ màn ảnh có thể vào "Chỉnh lịch" (↑↓, xoá, thêm điểm, thêm ngày) rồi quay lại. Ngoài ra có "Lịch của tôi", "Điểm đến", chi tiết điểm đến (Gọi, Chỉ đường).

Poster (`miniapp/src/components/poster/`): khổ 1080 px rộng, tối thiểu 4:5, lịch dài thì cao hơn và tự chuyển sang kiểu thu gọn. Ảnh địa điểm lấy qua `GET /api/img` của backend (máy chủ ảnh của cổng không có CORS). **Lưu ảnh** xuất PNG 2160 px; **Gửi** xuất JPEG 1080 px, tải lên `POST /api/posters` để có link công khai rồi mở bảng chia sẻ ảnh của Zalo (`openShareSheet` chỉ nhận link ảnh). Ngoài Zalo thì dùng Web Share, không có thì tải file.

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

Dữ liệu điểm đến lấy từ API của cổng du lịch Đắk Song (`https://core-360.vnaapi.com/travel-category/all/DAKNONG-2-29`) và được lưu thành `backend/data/places.json`, sau đó `npm run seed` nạp vào database (seed cũng tự xoá điểm mẫu cũ có slug `mau-*`).

```bash
cd backend
npm run import                                   # gọi API của cổng, ghi lại data/places.json
npm run import -- --from-file x.json             # hoặc dùng file JSON đã lưu sẵn (cùng định dạng API)
npm run seed                                     # nạp vào database
```

Quy tắc chuyển đổi nằm ở `backend/src/services/portal-import.ts` (có test với dữ liệu thật ở `backend/tests/fixtures/`):
- "Ăn Uống" và "Nhà hàng" → `am-thuc`; "Nhà nghỉ, khách sạn" → `luu-tru`; "Địa điểm du lịch" → `trai-nghiem`; "Di tích" → `thien-nhien` (thác, suối, núi, bảo tồn...) hoặc `van-hoa`.
- Bỏ qua nhóm "Y tế, bệnh viện" và "Cây giống" (không phải điểm du lịch).
- `durationMin` là **ước lượng theo loại**, cổng không có dữ liệu này.
- Ảnh: đường dẫn `360/xxx.jpg` được ghép với `https://static.dggv.edu.vn` (đổi bằng biến `PORTAL_IMAGE_BASE`). Đã kiểm chứng ngày 8/10/2026: cả 13 ảnh đều tải được và đúng là ảnh.
- `npm run import` đã được chạy thật với API của cổng ngày 8/10/2026 và cho đúng dữ liệu đang dùng. File xuất ra luôn sắp theo `slug` vì API không đảm bảo thứ tự. (Trong môi trường có proxy, Node có thể cần `NODE_USE_ENV_PROXY=1`.)

Các trường quan trọng cho thuật toán gợi ý: `category`, `tags`, `lat`, `lng`, `durationMin` (phút tham quan).

## Đánh giá Google Maps (tuỳ chọn)

Trang chi tiết điểm đến hiện điểm sao và tối đa 5 review của Google nếu backend có `GOOGLE_MAPS_API_KEY` (Places API (New)). Không có khoá thì phần này tự ẩn, các phần khác không ảnh hưởng. Backend chỉ gọi Google khi khách xem điểm đó, giữ bộ nhớ đệm 6 giờ và không lưu review vào database. Khoá đặt thành biến môi trường trên Railway, không đưa vào repo.

## Giỏ lịch trình và AI lên lịch

Khách lướt trang chủ / Điểm đến, bấm "+ Thêm" vào **giỏ lịch trình** (lưu theo tài khoản), rồi "Để AI lên lịch trình": nhập số người, ngày đi, số ngày/đêm, phương tiện (ô tô / xe máy / xe khách), AI xếp lịch từ giỏ, khách chat để chỉnh hoặc "Sửa tay", rồi "Chốt & tạo ảnh". Cần `GEMINI_API_KEY` (không có thì dùng lịch dự phòng theo khoảng cách). Thời gian di chuyển hiện là **ước tính** (đường chim bay × hệ số, tốc độ theo phương tiện) ở `backend/src/services/travel.ts`; đó là chỗ duy nhất cần thay khi dùng dữ liệu đường đi thật.

## Thêm địa điểm bằng bảng

Dán bảng từ Google Sheets vào một file, cột cách nhau bằng Tab (hoặc dấu `|`): `Tên | Nhóm | Vị trí | Địa chỉ | Điện thoại | Giờ mở cửa | Giá | Mô tả | Tháng (lễ hội)`. Nhóm: thiên nhiên, văn hoá, quán ăn, cà phê, đặc sản, lễ hội, trải nghiệm, lưu trú. Vị trí là toạ độ (`12.27,107.61`) hoặc link Google Maps đầy đủ (link rút gọn `maps.app.goo.gl` không đọc được); để trống thì quán hiện với vị trí tạm và chỉ đường theo tên.

```bash
cd backend
npm run add-places -- danh-sach.tsv --dry   # chỉ kiểm tra (toạ độ trong vùng Đắk Song, trùng tên, nhóm hợp lệ)
npm run add-places -- danh-sach.tsv         # ghi vào data/places.json
npm run seed                                 # nạp vào database
```

## Chatbot hỏi đáp (tuỳ chọn)

Linh vật voi con vẫy tay ở góc màn hình (bấm vào mở cửa sổ chat "Trợ lý Đắk Song") chỉ hiện khi backend có `GEMINI_API_KEY` (tạo ở Google AI Studio). Backend gửi danh sách điểm đến cho Gemini làm ngữ cảnh và yêu cầu chỉ trả lời theo dữ liệu đó. Model đổi bằng `GEMINI_MODEL` (mặc định `gemini-2.5-flash`, quá tải thì tự thử `GEMINI_FALLBACK_MODEL`), số câu hỏi mỗi người mỗi giờ bằng `CHAT_PER_HOUR`. Khoá đặt trên Railway, không đưa vào repo.

## Deploy Railway

`backend/railway.json` đã cấu hình build/start. Trên Railway:
1. Tạo project, thêm **Postgres**.
2. Thêm service từ repo GitHub, **Root Directory = `backend`**.
3. Biến môi trường: `DATABASE_URL` (tham chiếu tới Postgres), `AUTH_MODE=zalo` (hoặc `dev` khi demo), `CORS_ORIGIN`.
4. Generate domain, kiểm tra `https://<domain>/health`.

Khi khởi động, service tự chạy migration và seed.
