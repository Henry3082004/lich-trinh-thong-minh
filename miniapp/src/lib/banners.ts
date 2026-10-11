// Banner lớn đầu trang chủ. Chỉ cần thêm/sửa/xoá phần tử trong danh sách này (hoặc sau này lấy từ backend).
// category: nếu có điểm đến thuộc nhóm đó thì nút bấm mở danh sách nhóm; chưa có dữ liệu thì mở danh sách chung.
// to: đường dẫn trong app (ưu tiên hơn category).
import { IconCamera, IconCoffee, IconConfetti, IconSoup, IconSparkles, IconTrekking, type Icon } from "@tabler/icons-react";

const IMG = "https://static.dggv.edu.vn/360/";

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  to?: string;
  category?: string;
  collection?: string; // mở danh sách theo bộ sưu tập (lib/collections.ts)
  tag: string; // nhãn nhỏ trên tiêu đề
  icon: Icon;
  feature?: "ai"; // trang giới thiệu tính năng: có các bước + ảnh lịch trình mẫu
  steps?: string[];
  holdMs?: number; // thời gian dừng ở trang này trước khi tự lướt (mặc định 3,2 giây)
};

const UNSPLASH = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

export const BANNERS: Banner[] = [
  // Trang đầu: giới thiệu tính năng chính để ai mở link cũng thấy ngay
  {
    id: "ai",
    feature: "ai",
    tag: "Tính năng nổi bật",
    icon: IconSparkles,
    title: "Lịch trình thông minh bằng AI",
    subtitle: "Chọn kiểu chuyến đi, AI tự xếp điểm đến, giờ giấc và bữa ăn, rồi tải ảnh lịch trình đẹp về máy.",
    steps: ["Chọn kiểu đi", "AI xếp lịch", "Tải ảnh"],
    image: IMG + "1679365135640_daknong-thac-luu-ly.jpg",
    cta: "Thử tạo lịch trình",
    to: "/trip?auto=1",
    holdMs: 7000,
  },
  {
    id: "le-hoi",
    tag: "Lễ hội",
    icon: IconConfetti,
    title: "Lễ hội & mùa đẹp sắp tới",
    subtitle: "Mùa dã quỳ, lễ mừng lúa mới, đêm cồng chiêng: đừng bỏ lỡ dịp nào.",
    image: UNSPLASH("photo-1533174072545-7a4b6ad7a6c3"),
    cta: "Xem lễ hội sắp diễn ra",
    collection: "le-hoi-sap-toi",
  },
  {
    id: "check-in",
    tag: "Check-in",
    icon: IconCamera,
    title: "Điểm check-in nổi tiếng",
    subtitle: "Thác Lưu Ly, đồi thông săn mây, thiền viện giữa rừng.",
    image: IMG + "1679365135640_daknong-thac-luu-ly.jpg",
    cta: "Xem điểm check-in",
    collection: "check-in",
  },
  {
    id: "trekking",
    tag: "Trekking",
    icon: IconTrekking,
    title: "Trekking giữa đại ngàn",
    subtitle: "Băng rừng Nâm Nung, men suối đá, cắm trại trên thảo nguyên.",
    image: IMG + "1679365017974_123201-nam-nung-4.jpg",
    cta: "Xem cung trekking",
    collection: "trekking",
  },
  {
    id: "mon-ngon",
    tag: "Ẩm thực",
    icon: IconSoup,
    title: "Món ngon phải thử ở Đắk Song",
    subtitle: "Cơm lam gà nướng, canh thụt, rượu cần, hồ tiêu và cà phê đất đỏ.",
    image: UNSPLASH("photo-1555939594-58d7cb561ad1"),
    cta: "Xem món ngon",
    collection: "mon-ngon",
  },
  {
    id: "ca-phe",
    tag: "Cà phê",
    icon: IconCoffee,
    title: "Cà phê view đồi, chill cả ngày",
    subtitle: "Quán vườn, quán đồi, góc sống ảo cho chuyến đi.",
    image: IMG + "1681379418700_330464010_1349343925899736_2201816785743800654_n.jpg",
    cta: "Xem quán cà phê",
    collection: "ca-phe-view",
  },
];
