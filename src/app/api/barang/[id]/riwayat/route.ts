import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRiwayatDenganStokSetelah, getStokBarang } from "@/lib/stock";

export const dynamic = "force-dynamic";

// GET /api/barang/:id/riwayat -- info barang + stok saat ini + riwayat lengkap
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const barang = await prisma.barang.findUnique({ where: { id } });
  if (!barang) return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });

  const [stok, riwayat] = await Promise.all([getStokBarang(id), getRiwayatDenganStokSetelah(id)]);

  // Grafik 30 hari terakhir
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const grafik = riwayat
    .filter((r) => r.tanggalKejadian >= cutoff)
    .map((r) => ({ tanggal: r.tanggalKejadian, stok: r.stokSetelah }));

  return NextResponse.json({
    barang: { id: barang.id, kode: barang.kode, nama: barang.nama, stokMin: barang.stokMin, aktif: barang.aktif },
    stok,
    grafik,
    riwayat: riwayat.slice().reverse(), // terbaru duluan
  });
}
