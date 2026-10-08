# Nguồn nội dung địa điểm mới (places.new.json)

Ngày thực hiện: 2026-10-08. Kết quả: **0 mục mới** được ghi vào `backend/data/places.new.json` (mảng rỗng `[]`).

## Lý do

Môi trường chạy không cho truy cập web ngoài ở mức tải trang:

| Công cụ / domain | Lỗi |
|---|---|
| WebFetch: nominatim.openstreetmap.org | `getaddrinfo ENOTFOUND` |
| WebFetch: overpass-api.de | `getaddrinfo ENOTFOUND` |
| WebFetch: commons.wikimedia.org | `getaddrinfo ENOTFOUND` |
| WebFetch: vi.wikipedia.org, en.wikipedia.org | `getaddrinfo ENOTFOUND` |
| WebFetch: vnexpress.net | `getaddrinfo ENOTFOUND` |
| Bash curl tới Nominatim/Commons | bị bộ phân loại quyền của phiên từ chối (chưa thử cách khác) |

Chỉ WebSearch chạy được, nhưng nó chỉ trả về tóm tắt và danh sách link, không có tọa độ và không đọc được trang nguồn.

Các quy tắc bắt buộc là toạ độ đáng tin (OSM hoặc trang nguồn), nguồn thật sự đã đọc và ảnh Wikimedia kèm giấy phép. Không đủ dữ kiện để đáp ứng nên không ghi mục nào, tránh bịa dữ liệu.

## Gợi ý đã thấy trong kết quả tìm kiếm (CHƯA xác minh, chưa đưa vào dữ liệu)

- Công viên địa chất toàn cầu UNESCO Đắk Nông (có Đắk Song): hang động núi lửa, miệng núi lửa, thác nước.
- Thác Lưu Ly, Khu bảo tồn Nâm Nung (đã có trong places.json).
- Thác Đray Sáp / Đray Nur / Gia Long: nguồn mâu thuẫn về vị trí hành chính (Đắk Nông cũ, Lâm Đồng, Đắk Lắk), không chắc thuộc Đắk Song.
- Các bài tham khảo: tapchicongthuong.vn, mia.vn, vnexpress.net, baolamdong.vn, vietnambooking.com.

## Việc cần làm tiếp

Chạy lại tác vụ ở môi trường cho phép truy cập nominatim.openstreetmap.org, commons.wikimedia.org và các trang tin du lịch; hoặc cấp quyền cho curl qua proxy.
