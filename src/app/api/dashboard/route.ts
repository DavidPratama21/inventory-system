import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStokMap } from "@/lib/stock";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const startBulanIni = new Date(now.getFullYear(), now.getMonth(), 1);

  const [barangAktif, stokMap, aktivitasTerbaru, aktivitasBulanIni] = await Promise.all([
    prisma.barang.findMany({ where: { aktif: true } }),
    getStokMap(),
    prisma.aktivitas.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { barang: { select: { nama: true, kode: true } } },
    }),
    prisma.aktivitas.findMany({
      where: { tanggalKejadian: { gte: startBulanIni } },
      select: { tipe: true, qty: true },
    }),
  ]);

  const stokMenipis = barangAktif
    .filter((b) => b.stokMin !== null && (stokMap.get(b.id) ?? 0) <= b.stokMin!)
    .map((b) => ({ id: b.id, kode: b.kode, nama: b.nama, stok: stokMap.get(b.id) ?? 0, stokMin: b.stokMin }))
    .sort((a, b) => a.stok - b.stok);

  let masuk = 0;
  let keluar = 0;
  for (const a of aktivitasBulanIni) {
    if (a.tipe === "MASUK") masuk += a.qty;
    else if (a.tipe === "KELUAR") keluar += a.qty;
  }

  return NextResponse.json({
    totalBarang: barangAktif.length,
    masukBulanIni: masuk,
    keluarBulanIni: keluar,
    stokMenipis,
    aktivitasTerbaru: aktivitasTerbaru.map((a) => ({
      id: a.id,
      tipe: a.tipe,
      qty: a.qty,
      keterangan: a.keterangan,
      tanggalKejadian: a.tanggalKejadian,
      createdAt: a.createdAt,
      barangNama: a.barang?.nama ?? a.barangNamaSnap ?? "(barang dihapus)",
    })),
  });
}
