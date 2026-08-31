import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/barang/:id -- edit master data barang
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const { kode, nama, stokMin } = body;

  const before = await prisma.barang.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });

  if (kode?.trim()) {
    const dupe = await prisma.barang.findFirst({ where: { kode: kode.trim(), NOT: { id } } });
    if (dupe) {
      return NextResponse.json({ error: `Kode "${kode}" sudah dipakai barang lain` }, { status: 409 });
    }
  }

  const data = {
    ...(kode?.trim() && { kode: kode.trim() }),
    ...(nama?.trim() && { nama: nama.trim() }),
    stokMin: stokMin === "" || stokMin === undefined ? before.stokMin : stokMin === null ? null : Number(stokMin),
  };

  const barang = await prisma.barang.update({ where: { id }, data });

  await prisma.barangAuditLog.create({
    data: {
      barangId: barang.id,
      barangKodeSnap: barang.kode,
      barangNamaSnap: barang.nama,
      aksi: "EDIT",
      dataLama: { kode: before.kode, nama: before.nama, stokMin: before.stokMin },
      dataBaru: { kode: barang.kode, nama: barang.nama, stokMin: barang.stokMin },
    },
  });

  return NextResponse.json(barang);
}

// DELETE /api/barang/:id -- hapus permanen (snapshot ke aktivitas lama)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const barang = await prisma.barang.findUnique({ where: { id } });
  if (!barang) return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });

  await prisma.$transaction([
    // Tulis snapshot nama & kode ke semua aktivitas yang nyantol, lalu putuskan relasinya
    prisma.aktivitas.updateMany({
      where: { barangId: id },
      data: { barangKodeSnap: barang.kode, barangNamaSnap: barang.nama, barangId: null },
    }),
    prisma.barangAuditLog.create({
      data: {
        barangId: null,
        barangKodeSnap: barang.kode,
        barangNamaSnap: barang.nama,
        aksi: "HAPUS",
        dataLama: { kode: barang.kode, nama: barang.nama, stokMin: barang.stokMin },
      },
    }),
    prisma.barang.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
