// Cập nhật backend/data/places.json từ API của cổng du lịch Đắk Song.
//   npm run import                       gọi API (cần mạng tới core-360.vnaapi.com)
//   npm run import -- --from-file x.json dùng file JSON đã lưu sẵn (đúng định dạng API)
// Sau đó chạy `npm run seed` để nạp vào database.
import fs from "node:fs";
import path from "node:path";
import { convertPortalCategories, type PortalCategory } from "../src/services/portal-import";

const API = process.env.PORTAL_API ?? "https://core-360.vnaapi.com";
const TENANT = process.env.PORTAL_TENANT ?? "DAKNONG-2-29";
const OUT = path.join(__dirname, "..", "data", "places.json");

async function load(): Promise<PortalCategory[]> {
  const fileIdx = process.argv.indexOf("--from-file");
  const body =
    fileIdx > -1
      ? JSON.parse(fs.readFileSync(process.argv[fileIdx + 1], "utf8"))
      : await fetch(`${API}/travel-category/all/${TENANT}`).then(async (res) => {
          if (!res.ok) throw new Error(`API trả về ${res.status}`);
          return res.json();
        });
  if (!body?.success || !Array.isArray(body.data)) throw new Error("Dữ liệu API không đúng định dạng");
  return body.data;
}

async function main() {
  const { places, skipped } = convertPortalCategories(await load(), { imageBase: process.env.PORTAL_IMAGE_BASE });
  if (places.length === 0) throw new Error("Không có điểm đến nào, giữ nguyên file cũ");
  fs.writeFileSync(OUT, JSON.stringify(places, null, 2) + "\n");
  console.log(`Đã ghi ${places.length} điểm đến vào ${OUT}`);
  for (const s of skipped) console.log(`  bỏ qua: ${s.name} (${s.reason})`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
