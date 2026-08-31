import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/barang/:id/status  { aktif: boolean }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { aktif } = await req.json();

  const barang = await prisma.barang.update({ where: { id }, data: { aktif } });

  await prisma.barangAuditLog.create({
    data: {
      barangId: barang.id,
      barangKodeSnap: barang.kode,
      barangNamaSnap: barang.nama,
      aksi: aktif ? "AKTIFKAN" : "NONAKTIFKAN",
    },
  });

  return NextResponse.json(barang);
}
