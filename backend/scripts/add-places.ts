// Thêm địa điểm từ một bảng (TSV/| dán từ Google Sheets) vào data/places.json.
// Dùng: npm run add-places -- danh-sach.tsv   (thêm --dry để chỉ kiểm tra, không ghi)
import fs from "node:fs";
import path from "node:path";
import { parsePlaces } from "../src/services/add-places";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("Cách dùng: npm run add-places -- <file.tsv> [--dry]");
  process.exit(2);
}
const target = path.join(__dirname, "../data/places.json");
const current = JSON.parse(fs.readFileSync(target, "utf8")) as { slug: string; name: string }[];
const { places, errors, warnings } = parsePlaces(fs.readFileSync(file, "utf8"), current);

for (const w of warnings) console.warn("⚠", w);
for (const e of errors) console.error("✘", e);
console.log(`Đọc được ${places.length} địa điểm hợp lệ, ${errors.length} dòng lỗi (bỏ qua), ${warnings.length} cảnh báo.`);
if (!dry && places.length > 0) {
  const merged = [...current, ...places].sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(target, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Đã ghi ${places.length} địa điểm mới vào data/places.json (tổng ${merged.length}). Chạy "npm run seed" để nạp vào database.`);
}
process.exit(errors.length > 0 ? 1 : 0);
