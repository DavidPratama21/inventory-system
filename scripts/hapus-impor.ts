import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);
  const akhirHariIni = new Date();
  akhirHariIni.setHours(23, 59, 59, 999);

  const tanggalBenar = new Date(2026, 1, 8); // bulan di JS mulai dari 0 -> 1 = Februari

  const { count } = await prisma.aktivitas.updateMany({
    where: {
      tipe: "PENYESUAIAN",
      tanggalKejadian: { gte: awalHariIni, lte: akhirHariIni },
    },
    data: { tanggalKejadian: tanggalBenar },
  });

  console.log(`Terupdate: ${count} aktivitas Penyesuaian, tanggal diubah ke 8 Februari 2026.`);
}

main().finally(() => prisma.$disconnect());