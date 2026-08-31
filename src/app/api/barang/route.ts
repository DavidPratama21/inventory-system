import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStokMap, getTerakhirDiubahMap } from "@/lib/stock";

export const dynamic = "force-dynamic";

// GET /api/barang?page=1&pageSize=20&search=seal&sortBy=nama&sortDir=asc&status=aktif&stokMenipis=1&sort=recent
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(1000, Number(searchParams.get("pageSize")) || 20);
  const search = searchParams.get("search")?.trim() ?? "";
  const sort = searchParams.get("sort"); // "recent" -- dipakai modal Tambah Aktivitas
  const sortBy = searchParams.get("sortBy"); // "kode" | "nama" | "terakhirDiubah" | "status"
  const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";
  const status = searchParams.get("status"); // "aktif" | "nonaktif"
  const stokMenipis = searchParams.get("stokMenipis") === "1";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" as const } },
      { kode: { contains: search, mode: "insensitive" as const } },
    ];
  }
  if (status === "aktif") where.aktif = true;
  if (status === "nonaktif") where.aktif = false;

  const [semuaBarang, stokMap, terakhirMap] = await Promise.all([
    prisma.barang.findMany({ where: where as any }),
    getStokMap(),
    getTerakhirDiubahMap(),
  ]);

  let daftar = semuaBarang.map((b) => ({
    id: b.id,
    kode: b.kode,
    nama: b.nama,
    stokMin: b.stokMin,
    aktif: b.aktif,
    stok: stokMap.get(b.id) ?? 0,
    terakhirDiubahDate: terakhirMap.get(b.id) ?? null,
    terakhirDiubah: terakhirMap.get(b.id)?.toISOString() ?? null,
  }));

  if (stokMenipis) {
    daftar = daftar.filter((b) => b.stokMin !== null && b.stok <= b.stokMin);
  }

  if (sort === "recent") {
    daftar.sort((a, b) => (b.terakhirDiubahDate?.getTime() ?? 0) - (a.terakhirDiubahDate?.getTime() ?? 0));
  } else if (sortBy) {
    daftar.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "kode") cmp = a.kode.localeCompare(b.kode);
      else if (sortBy === "nama") cmp = a.nama.localeCompare(b.nama);
      else if (sortBy === "status") cmp = Number(b.aktif) - Number(a.aktif);
      else if (sortBy === "terakhirDiubah") {
        cmp = (a.terakhirDiubahDate?.getTime() ?? 0) - (b.terakhirDiubahDate?.getTime() ?? 0);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  } else {
    daftar.sort((a, b) => Number(b.aktif) - Number(a.aktif) || a.nama.localeCompare(b.nama));
  }

  const total = daftar.length;
  const paged = daftar.slice((page - 1) * pageSize, page * pageSize).map(({ terakhirDiubahDate, ...rest }) => rest);

  return NextResponse.json({ data: paged, total, page, pageSize });
}

// POST /api/barang -- tambah barang baru
export async function POST(req: Request) {
  const body = await req.json();
  const { kode, nama, stokMin } = body;

  if (!kode?.trim() || !nama?.trim()) {
    return NextResponse.json({ error: "Kode dan nama wajib diisi" }, { status: 400 });
  }

  const exists = await prisma.barang.findUnique({ where: { kode: kode.trim() } });
  if (exists) {
    return NextResponse.json({ error: `Kode "${kode}" sudah dipakai barang lain` }, { status: 409 });
  }

  const barang = await prisma.barang.create({
    data: {
      kode: kode.trim(),
      nama: nama.trim(),
      stokMin: stokMin === "" || stokMin === undefined || stokMin === null ? null : Number(stokMin),
    },
  });

  await prisma.barangAuditLog.create({
    data: {
      barangId: barang.id,
      barangKodeSnap: barang.kode,
      barangNamaSnap: barang.nama,
      aksi: "TAMBAH",
      dataBaru: { kode: barang.kode, nama: barang.nama, stokMin: barang.stokMin },
    },
  });

  return NextResponse.json(barang, { status: 201 });
}
