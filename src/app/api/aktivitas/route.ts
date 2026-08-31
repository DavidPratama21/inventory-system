import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { efekStok } from "@/lib/efek";
import { getStokBarang, getStokSetelah } from "@/lib/stock";

export const dynamic = "force-dynamic";

// GET /api/aktivitas?page=1&pageSize=20&tipe=MASUK&dateFrom=...&dateTo=...&search=...&barangId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Number(searchParams.get("pageSize")) || 20);
  const tipe = searchParams.get("tipe");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search")?.trim();
  const barangId = searchParams.get("barangId");

  const where: Record<string, unknown> = {};
  if (tipe) where.tipe = tipe;
  if (barangId) where.barangId = Number(barangId);
  if (dateFrom || dateTo) {
    where.tanggalKejadian = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };
  }
  if (search) {
    where.OR = [
      { barang: { nama: { contains: search, mode: "insensitive" } } },
      { barangNamaSnap: { contains: search, mode: "insensitive" } },
    { barangNamaSnap: { contains: search, mode: "insensitive" } },
    { barangKodeSnap: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.aktivitas.findMany({
      where: where as any,
      orderBy: [{ tanggalKejadian: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { barang: { select: { id: true, kode: true, nama: true } } },
    }),
    prisma.aktivitas.count({ where: where as any }),
  ]);

  const data = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      barangId: r.barangId,
      barangNama: r.barang?.nama ?? r.barangNamaSnap ?? "(barang dihapus)",
      barangKode: r.barang?.kode ?? r.barangKodeSnap ?? "-",
      tipe: r.tipe,
      qty: r.qty,
      kondisiRetur: r.kondisiRetur,
      keterangan: r.keterangan,
      tanggalKejadian: r.tanggalKejadian,
      createdAt: r.createdAt,
      stokSetelah: r.barangId ? await getStokSetelah(r.barangId, r.tanggalKejadian, r.id) : null,
    }))
  );

  return NextResponse.json({ data, total, page, pageSize });
}

// POST /api/aktivitas -- catat aktivitas baru
export async function POST(req: Request) {
  const body = await req.json();
  const { barangId, tipe, qty, kondisiRetur, keterangan, tanggalKejadian } = body;

  const q = Number(qty);
  if (!barangId || !tipe || !q || !tanggalKejadian) {
    return NextResponse.json({ error: "Barang, tipe, jumlah, dan tanggal wajib diisi" }, { status: 400 });
  }
  if (!["MASUK", "KELUAR", "RUSAK", "RETUR", "PENYESUAIAN"].includes(tipe)) {
    return NextResponse.json({ error: "Tipe tidak valid" }, { status: 400 });
  }
  if (tipe === "RETUR" && !["OKE", "RUSAK"].includes(kondisiRetur)) {
    return NextResponse.json({ error: "Kondisi retur wajib dipilih" }, { status: 400 });
  }
  if (tipe !== "PENYESUAIAN" && q <= 0) {
    return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 });
  }

  const barang = await prisma.barang.findUnique({ where: { id: Number(barangId) } });
  if (!barang) return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });

  const stokSekarang = await getStokBarang(barang.id);
  const efek = efekStok({ tipe, qty: q, kondisiRetur });
  if (stokSekarang + efek < 0) {
    return NextResponse.json(
      { error: `Stok ${barang.nama} tidak cukup (sisa ${stokSekarang})` },
      { status: 400 }
    );
  }

  const aktivitas = await prisma.aktivitas.create({
    data: {
      barangId: barang.id,
      tipe,
      qty: q,
      kondisiRetur: tipe === "RETUR" ? kondisiRetur : null,
      keterangan: keterangan?.trim() || null,
      tanggalKejadian: new Date(tanggalKejadian),
    },
  });

  return NextResponse.json(aktivitas, { status: 201 });
}
