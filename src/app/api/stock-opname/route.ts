import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStokMap } from "@/lib/stock";

export const dynamic = "force-dynamic";

// POST /api/stock-opname
// body: { tanggalOpname: string, items: [{ barangId, stokFisik, keterangan? }] }
export async function POST(req: Request) {
  const body = await req.json();
  const { tanggalOpname, items } = body;

  if (!tanggalOpname || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Tanggal opname dan minimal 1 barang wajib diisi" }, { status: 400 });
  }

  const stokMap = await getStokMap();
  const dibuat: number[] = [];

  for (const item of items) {
    const barangId = Number(item.barangId);
    const stokFisik = Number(item.stokFisik);
    if (!barangId || Number.isNaN(stokFisik)) continue;

    const stokSistem = stokMap.get(barangId) ?? 0;
    const selisih = stokFisik - stokSistem;
    if (selisih === 0) continue; // sama, tidak perlu dicatat

    const aktivitas = await prisma.aktivitas.create({
      data: {
        barangId,
        tipe: "PENYESUAIAN",
        qty: selisih, // signed: bisa negatif
        keterangan: item.keterangan?.trim() || `Stock opname ${tanggalOpname}: sistem ${stokSistem} -> fisik ${stokFisik}`,
        tanggalKejadian: new Date(tanggalOpname),
      },
    });
    dibuat.push(aktivitas.id);
  }

  return NextResponse.json({ ok: true, jumlahDisesuaikan: dibuat.length });
}
