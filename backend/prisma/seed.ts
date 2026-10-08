// Nạp điểm đến từ data/places.json. Chạy lại an toàn: upsert theo slug.
// Dữ liệu mẫu cũ (slug bắt đầu bằng "mau-") bị xoá, kèm các mục lịch trình thử đang dùng chúng.
import { PrismaClient } from "@prisma/client";
import places from "../data/places.json";

const prisma = new PrismaClient();

async function main() {
  const slugs = places.map((p) => p.slug);

  const sampleWhere = { slug: { startsWith: "mau-", notIn: slugs } };
  const removedItems = await prisma.itineraryItem.deleteMany({ where: { place: sampleWhere } });
  const removedPlaces = await prisma.place.deleteMany({ where: sampleWhere });
  if (removedPlaces.count > 0) {
    console.log(`Đã xoá ${removedPlaces.count} điểm mẫu và ${removedItems.count} mục lịch trình thử`);
  }

  for (const p of places) {
    const data = {
      ...p,
      address: p.address ?? null,
      openHours: p.openHours ?? null,
      sourceUrl: p.sourceUrl ?? null,
      phone: p.phone ?? null,
      mapLink: p.mapLink ?? null,
    };
    await prisma.place.upsert({ where: { slug: p.slug }, create: data, update: data });
  }
  console.log(`Đã nạp ${places.length} điểm đến`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
