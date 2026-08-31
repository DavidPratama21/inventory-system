import { prisma } from "./prisma";
import { efekStok } from "./efek";

/**
 * Hitung stok semua barang sekaligus (efisien untuk daftar/tabel).
 * Return: Map<barangId, stok>
 */
export async function getStokMap(): Promise<Map<number, number>> {
  const grouped = await prisma.aktivitas.groupBy({
    by: ["barangId", "tipe", "kondisiRetur"],
    where: { barangId: { not: null } },
    _sum: { qty: true },
  });

  const map = new Map<number, number>();
  for (const g of grouped) {
    if (g.barangId === null) continue;
    const delta = efekStok({
      tipe: g.tipe,
      qty: g._sum.qty ?? 0,
      kondisiRetur: g.kondisiRetur,
    });
    map.set(g.barangId, (map.get(g.barangId) ?? 0) + delta);
  }
  return map;
}

/** Stok satu barang saja. */
export async function getStokBarang(barangId: number): Promise<number> {
  const map = await getStokMap();
  return map.get(barangId) ?? 0;
}

/**
 * Tanggal aktivitas terakhir tiap barang (dipakai kolom "Terakhir Diubah"
 * di Master Barang). Return: Map<barangId, Date>
 */
export async function getTerakhirDiubahMap(): Promise<Map<number, Date>> {
  const grouped = await prisma.aktivitas.groupBy({
    by: ["barangId"],
    where: { barangId: { not: null } },
    _max: { tanggalKejadian: true },
  });
  const map = new Map<number, Date>();
  for (const g of grouped) {
    if (g.barangId !== null && g._max.tanggalKejadian) {
      map.set(g.barangId, g._max.tanggalKejadian);
    }
  }
  return map;
}

/**
 * Hitung stok kumulatif SETELAH satu aktivitas tertentu terjadi
 * (dipakai kolom "Stok Setelah" di halaman Riwayat).
 * Urutan kronologis: tanggalKejadian, lalu id sebagai tie-breaker.
 */
export async function getStokSetelah(
  barangId: number,
  tanggalKejadian: Date,
  id: number
): Promise<number> {
  const rows = await prisma.aktivitas.findMany({
    where: {
      barangId,
      OR: [
        { tanggalKejadian: { lt: tanggalKejadian } },
        { tanggalKejadian: tanggalKejadian, id: { lte: id } },
      ],
    },
    select: { tipe: true, qty: true, kondisiRetur: true },
  });
  return rows.reduce((total, r) => total + efekStok(r), 0);
}

/** Riwayat pergerakan stok kumulatif satu barang, untuk grafik & tabel detail. */
export async function getRiwayatDenganStokSetelah(barangId: number) {
  const rows = await prisma.aktivitas.findMany({
    where: { barangId },
    orderBy: [{ tanggalKejadian: "asc" }, { id: "asc" }],
  });
  let running = 0;
  return rows.map((r) => {
    running += efekStok(r);
    return { ...r, stokSetelah: running };
  });
}
