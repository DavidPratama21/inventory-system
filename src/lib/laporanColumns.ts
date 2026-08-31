export type KolomKey =
  | "no"
  | "kode"
  | "nama"
  | "awal"
  | "masuk"
  | "keluar"
  | "rusak"
  | "retur"
  | "returOke"
  | "returRusak"
  | "akhir";

export const SEMUA_KOLOM: { key: KolomKey; label: string }[] = [
  { key: "no", label: "No" },
  { key: "kode", label: "Kode" },
  { key: "nama", label: "Nama" },
  { key: "awal", label: "Stok Awal" },
  { key: "masuk", label: "Masuk" },
  { key: "keluar", label: "Keluar" },
  { key: "rusak", label: "Rusak" },
  { key: "retur", label: "Retur" },
  { key: "returOke", label: "Retur (Oke)" },
  { key: "returRusak", label: "Retur (Rusak)" },
  { key: "akhir", label: "Stok Akhir" },
];

export const PRESET_STOK_AKHIR: KolomKey[] = ["no", "kode", "nama", "akhir"];
export const PRESET_PERGERAKAN: KolomKey[] = ["no", "kode", "nama", "masuk", "keluar", "rusak", "retur"];

export const BATAS_AMAN_KOLOM = 7; // di atas ini, kasih peringatan gak muat A4 portrait

export function ambilNilaiKolom(row: any, key: KolomKey, nomor: number): string | number {
  if (key === "no") return nomor;
  if (key === "retur") return (row.returOke ?? 0) + (row.returRusak ?? 0);
  return row[key] ?? 0;
}
