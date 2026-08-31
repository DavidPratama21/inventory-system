import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/dashboard/detail?tipe=MASUK
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipe = searchParams.get("tipe");
  if (tipe !== "MASUK" && tipe !== "KELUAR") {
    return NextResponse.json({ error: "Parameter tipe harus MASUK atau KELUAR" }, { status: 400 });
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await prisma.aktivitas.findMany({
    where: { tipe, tanggalKejadian: { gte: start } },
    include: { barang: { select: { nama: true, kode: true } } },
    orderBy: { tanggalKejadian: "desc" },
  });

  // Kelompokkan per barang
  const map = new Map<string, { nama: string; kode: string; total: number }>();
  for (const r of rows) {
    const nama = r.barang?.nama ?? r.barangNamaSnap ?? "(barang dihapus)";
    const kode = r.barang?.kode ?? r.barangKodeSnap ?? "-";
    const key = kode;
    const cur = map.get(key) ?? { nama, kode, total: 0 };
    cur.total += r.qty;
    map.set(key, cur);
  }

  const data = [...map.values()].sort((a, b) => b.total - a.total);
  return NextResponse.json({ data });
}
