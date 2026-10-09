// Banner lớn đầu trang chủ. Chỉ cần thêm/sửa/xoá phần tử trong danh sách này (hoặc sau này lấy từ backend).
// category: nếu có điểm đến thuộc nhóm đó thì nút bấm mở danh sách nhóm; chưa có dữ liệu thì mở danh sách chung.
// to: đường dẫn trong app (ưu tiên hơn category).
const IMG = "https://static.dggv.edu.vn/360/";

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  to?: string;
  category?: string;
};

export const BANNERS: Banner[] = [
  {
    id: "ai-plan",
    title: "Chào bạn, đi Đắk Song mấy ngày?",
    subtitle: "Chọn chỗ bạn thích, AI xếp lịch trình và làm ảnh đẹp để gửi gia đình, bạn bè.",
    image: IMG + "1679365017974_123201-nam-nung-4.jpg",
    cta: "Để AI lên lịch trình",
    to: "/cart",
  },
  {
    id: "le-hoi",
    title: "Lễ hội và văn hoá Tây Nguyên",
    subtitle: "Cồng chiêng, nhà dài, những mùa lễ hội đậm bản sắc của người M'Nông.",
    image: IMG + "1679364818513_thien-vien-truc-lam-dao-nguyen-5.jpg",
    cta: "Khám phá lễ hội",
    category: "le-hoi",
  },
  {
    id: "trekking",
    title: "Trekking, cắm trại giữa đại ngàn",
    subtitle: "Băng rừng Nâm Nung, ngắm thác, cắm trại trên thảo nguyên.",
    image: IMG + "1679365017974_123201-nam-nung-4.jpg",
    cta: "Xem điểm thiên nhiên",
    category: "thien-nhien",
  },
  {
    id: "thac",
    title: "Thác nước xanh mát",
    subtitle: "Thác Lưu Ly và những điểm check-in giữa rừng.",
    image: IMG + "1679365135640_daknong-thac-luu-ly.jpg",
    cta: "Xem điểm đến",
    category: "thien-nhien",
  },
  {
    id: "ca-phe",
    title: "Cà phê và món ngon địa phương",
    subtitle: "Quán cà phê view đẹp, ăn gì ở Đắk Song.",
    image: IMG + "1682415746498_2022-04-21.jpg",
    cta: "Xem quán cà phê",
    category: "ca-phe",
  },
  {
    id: "anh-nhanh",
    title: "2 chạm có ngay ảnh lịch trình",
    subtitle: "Chọn số ngày, nhận tấm ảnh đẹp để lưu về hoặc gửi qua Zalo.",
    image: IMG + "1681379418700_330464010_1349343925899736_2201816785743800654_n.jpg",
    cta: "Tạo ảnh ngay",
    to: "/create",
  },
];
