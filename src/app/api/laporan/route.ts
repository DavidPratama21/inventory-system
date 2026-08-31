import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { efekStok } from "@/lib/efek";

export const dynamic = "force-dynamic";

type Mov = { masuk: number; keluar: number; rusak: number; returOke: number; returRusak: number; penyesuaian: number };
const emptyMov = (): Mov => ({ masuk: 0, keluar: 0, rusak: 0, returOke: 0, returRusak: 0, penyesuaian: 0 });

// GET /api/laporan?month=8&year=2026
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month")); // 1-12
  const year = Number(searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ error: "Parameter month dan year wajib diisi" }, { status: 400 });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  // Termasuk barang nonaktif -- laporan historis tidak difilter status
  const [barangList, sebelum, selamaBulan] = await Promise.all([
    prisma.barang.findMany({ orderBy: { nama: "asc" } }),
    prisma.aktivitas.groupBy({
      by: ["barangId", "tipe", "kondisiRetur"],
      where: { tanggalKejadian: { lt: start }, barangId: { not: null } },
      _sum: { qty: true },
    }),
    prisma.aktivitas.findMany({
      where: { tanggalKejadian: { gte: start, lt: end }, barangId: { not: null } },
      select: { barangId: true, tipe: true, qty: true, kondisiRetur: true },
    }),
  ]);

  const awalMap = new Map<number, number>();
  for (const g of sebelum) {
    if (!g.barangId) continue;
    const d = efekStok({ tipe: g.tipe, qty: g._sum.qty ?? 0, kondisiRetur: g.kondisiRetur });
    awalMap.set(g.barangId, (awalMap.get(g.barangId) ?? 0) + d);
  }

  const movMap = new Map<number, Mov>();
  for (const a of selamaBulan) {
    if (!a.barangId) continue;
    const mv = movMap.get(a.barangId) ?? emptyMov();
    if (a.tipe === "MASUK") mv.masuk += a.qty;
    else if (a.tipe === "KELUAR") mv.keluar += a.qty;
    else if (a.tipe === "RUSAK") mv.rusak += a.qty;
    else if (a.tipe === "RETUR") {
      if (a.kondisiRetur === "OKE") mv.returOke += a.qty;
      else mv.returRusak += a.qty;
    } else if (a.tipe === "PENYESUAIAN") mv.penyesuaian += a.qty;
    movMap.set(a.barangId, mv);
  }

  // Hanya tampilkan barang yang punya histori/stok relevan di periode itu, atau aktif
  const rows = barangList
    .map((b) => {
      const awal = awalMap.get(b.id) ?? 0;
      const mv = movMap.get(b.id) ?? emptyMov();
      const akhir = awal + mv.masuk + mv.returOke + mv.penyesuaian - mv.keluar - mv.rusak;
      const adaAktivitas = Object.values(mv).some((v) => v !== 0);
      return {
        kode: b.kode,
        nama: b.nama,
        awal,
        ...mv,
        akhir,
        relevan: b.aktif || adaAktivitas || awal !== 0,
      };
    })
    .filter((r) => r.relevan);

  const namaBulan = start.toLocaleString("id-ID", { month: "long" });
  return NextResponse.json({ periode: `${namaBulan} ${year}`, rows });
}
