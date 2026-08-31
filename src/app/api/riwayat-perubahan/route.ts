import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatBarangDetail(aksi: string, dataLama: any, dataBaru: any): string {
  if (aksi === "TAMBAH") return "Barang baru ditambahkan";
  if (aksi === "NONAKTIFKAN") return "Dinonaktifkan";
  if (aksi === "AKTIFKAN") return "Diaktifkan kembali";
  if (aksi === "HAPUS") return "Dihapus permanen";
  if (aksi === "EDIT" && dataLama && dataBaru) {
    const perubahan: string[] = [];
    for (const key of ["kode", "nama", "stokMin"]) {
      if (dataLama[key] !== dataBaru[key]) {
        perubahan.push(`${key}: ${dataLama[key] ?? "-"} → ${dataBaru[key] ?? "-"}`);
      }
    }
    return perubahan.join(", ") || "Tidak ada perubahan nilai";
  }
  return "-";
}

function formatAktivitasDetail(aksi: string, dataLama: any, dataBaru: any): string {
  if (aksi === "HAPUS") return `Aktivitas dihapus (qty ${dataLama?.qty ?? "-"}, tipe ${dataLama?.tipe ?? "-"})`;
  if (aksi === "EDIT" && dataLama && dataBaru) {
    const perubahan: string[] = [];
    for (const key of ["qty", "kondisiRetur", "keterangan", "tanggalKejadian"]) {
      if (String(dataLama[key]) !== String(dataBaru[key])) {
        perubahan.push(`${key}: ${dataLama[key] ?? "-"} → ${dataBaru[key] ?? "-"}`);
      }
    }
    return perubahan.join(", ") || "Tidak ada perubahan nilai";
  }
  return "-";
}

// GET /api/riwayat-perubahan?page=1&pageSize=20&jenis=barang:EDIT&dateFrom=&dateTo=&search=
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Number(searchParams.get("pageSize")) || 20);
  const jenis = searchParams.get("jenis"); // "barang:EDIT" | "aktivitas:HAPUS" | dst
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search")?.trim();

  const [sumberFilter, aksiFilter] = jenis?.split(":") ?? [null, null];

  const dateWhere =
    dateFrom || dateTo
      ? { gte: dateFrom ? new Date(dateFrom) : undefined, lte: dateTo ? new Date(dateTo) : undefined }
      : undefined;

  const [barangLogs, aktivitasLogs] = await Promise.all([
    sumberFilter && sumberFilter !== "barang"
      ? []
      : prisma.barangAuditLog.findMany({
          where: {
            ...(dateWhere && { waktuPerubahan: dateWhere }),
            ...(aksiFilter && sumberFilter === "barang" && { aksi: aksiFilter as any }),
            ...(search && { barangNamaSnap: { contains: search, mode: "insensitive" } }),
          } as any,
          orderBy: { waktuPerubahan: "desc" },
        }),
    sumberFilter && sumberFilter !== "aktivitas"
      ? []
      : prisma.aktivitasAuditLog.findMany({
          where: {
            ...(dateWhere && { waktuPerubahan: dateWhere }),
            ...(aksiFilter && sumberFilter === "aktivitas" && { aksi: aksiFilter as any }),
            ...(search && { barangNamaSnap: { contains: search, mode: "insensitive" } }),
          } as any,
          orderBy: { waktuPerubahan: "desc" },
        }),
  ]);

  const gabungan = [
    ...barangLogs.map((l) => ({
      id: `barang-${l.id}`,
      sumber: "barang" as const,
      aksi: l.aksi,
      barangNama: l.barangNamaSnap,
      detail: formatBarangDetail(l.aksi, l.dataLama, l.dataBaru),
      waktuPerubahan: l.waktuPerubahan,
    })),
    ...aktivitasLogs.map((l) => ({
      id: `aktivitas-${l.id}`,
      sumber: "aktivitas" as const,
      aksi: l.aksi,
      barangNama: l.barangNamaSnap,
      detail: formatAktivitasDetail(l.aksi, l.dataLama, l.dataBaru),
      waktuPerubahan: l.waktuPerubahan,
    })),
  ].sort((a, b) => b.waktuPerubahan.getTime() - a.waktuPerubahan.getTime());

  const total = gabungan.length;
  const data = gabungan.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({ data, total, page, pageSize });
}
