// Nạp điểm đến từ data/places.json. Chạy lại an toàn: upsert theo slug.
import { PrismaClient } from "@prisma/client";
import places from "../data/places.json";

const prisma = new PrismaClient();

async function main() {
  for (const p of places) {
    const data = {
      ...p,
      address: p.address ?? null,
      openHours: p.openHours ?? null,
      sourceUrl: p.sourceUrl ?? null,
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
