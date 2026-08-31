import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { efekStok } from "@/lib/efek";
import { getStokBarang } from "@/lib/stock";

export const dynamic = "force-dynamic";

// PATCH /api/aktivitas/:id -- edit aktivitas (dengan validasi stok & audit log)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const { barangId, qty, kondisiRetur, keterangan, tanggalKejadian } = body;

  const before = await prisma.aktivitas.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Aktivitas tidak ditemukan" }, { status: 404 });
  if (!before.barangId) {
    return NextResponse.json(
      { error: "Barang untuk aktivitas ini sudah dihapus permanen, tidak bisa diedit" },
      { status: 409 }
    );
  }

  const qBaru = qty !== undefined ? Number(qty) : before.qty;
  const kondisiBaru = kondisiRetur !== undefined ? kondisiRetur : before.kondisiRetur;
  const barangIdBaru = barangId !== undefined ? Number(barangId) : before.barangId;
  const efekBaru = efekStok({ tipe: before.tipe, qty: qBaru, kondisiRetur: kondisiBaru });

  if (barangIdBaru !== before.barangId) {
    // Barang diganti -- validasi dua sisi: stok barang lama (efek dicabut) & barang baru (efek ditambah)
    const barangBaru = await prisma.barang.findUnique({ where: { id: barangIdBaru } });
    if (!barangBaru) return NextResponse.json({ error: "Barang baru tidak ditemukan" }, { status: 404 });

    const stokLama = await getStokBarang(before.barangId);
    const efekLama = efekStok(before);
    if (stokLama - efekLama < 0) {
      return NextResponse.json(
        { error: `Memindahkan aktivitas ini membuat stok barang lama jadi minus (${stokLama - efekLama})` },
        { status: 400 }
      );
    }

    const stokBaru = await getStokBarang(barangIdBaru);
    if (stokBaru + efekBaru < 0) {
      return NextResponse.json(
        { error: `Stok ${barangBaru.nama} tidak cukup untuk perubahan ini (sisa ${stokBaru})` },
        { status: 400 }
      );
    }
  } else {
    // Barang sama -- validasi stok tidak boleh minus: hitung ulang tanpa efek lama, lalu tambah efek baru
    const stokSekarang = await getStokBarang(before.barangId);
    const efekLama = efekStok(before);
    const stokProyeksi = stokSekarang - efekLama + efekBaru;
    if (stokProyeksi < 0) {
      return NextResponse.json({ error: `Perubahan ini membuat stok jadi minus (${stokProyeksi})` }, { status: 400 });
    }
  }

  const updated = await prisma.aktivitas.update({
    where: { id },
    data: {
      barangId: barangIdBaru,
      qty: qBaru,
      kondisiRetur: before.tipe === "RETUR" ? kondisiBaru : null,
      keterangan: keterangan !== undefined ? keterangan?.trim() || null : before.keterangan,
      tanggalKejadian: tanggalKejadian ? new Date(tanggalKejadian) : before.tanggalKejadian,
    },
  });

  await prisma.aktivitasAuditLog.create({
    data: {
      aktivitasId: updated.id,
      barangNamaSnap: before.barangNamaSnap ?? "(lihat relasi barang)",
      aksi: "EDIT",
      dataLama: {
        barangId: before.barangId,
        qty: before.qty,
        kondisiRetur: before.kondisiRetur,
        keterangan: before.keterangan,
        tanggalKejadian: before.tanggalKejadian,
      },
      dataBaru: {
        barangId: updated.barangId,
        qty: updated.qty,
        kondisiRetur: updated.kondisiRetur,
        keterangan: updated.keterangan,
        tanggalKejadian: updated.tanggalKejadian,
      },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/aktivitas/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const aktivitas = await prisma.aktivitas.findUnique({
    where: { id },
    include: { barang: { select: { nama: true } } },
  });
  if (!aktivitas) return NextResponse.json({ error: "Aktivitas tidak ditemukan" }, { status: 404 });

  if (aktivitas.barangId) {
    const stokSekarang = await getStokBarang(aktivitas.barangId);
    const efek = efekStok(aktivitas);
    if (stokSekarang - efek < 0) {
      return NextResponse.json(
        { error: `Menghapus aktivitas ini membuat stok jadi minus (${stokSekarang - efek})` },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction([
    prisma.aktivitasAuditLog.create({
      data: {
        aktivitasId: null,
        barangNamaSnap: aktivitas.barang?.nama ?? aktivitas.barangNamaSnap ?? "(barang dihapus)",
        aksi: "HAPUS",
        dataLama: {
          tipe: aktivitas.tipe,
          qty: aktivitas.qty,
          kondisiRetur: aktivitas.kondisiRetur,
          keterangan: aktivitas.keterangan,
          tanggalKejadian: aktivitas.tanggalKejadian,
        },
      },
    }),
    prisma.aktivitas.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
