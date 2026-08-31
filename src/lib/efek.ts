import type { KondisiRetur, TipeAktivitas } from "@prisma/client";

export type AktivitasEfekInput = {
  tipe: TipeAktivitas;
  qty: number;
  kondisiRetur?: KondisiRetur | null;
};

/**
 * Menghitung efek satu aktivitas terhadap stok (angka bertanda).
 * MASUK        -> +qty
 * KELUAR       -> -qty
 * RUSAK        -> -qty
 * RETUR (OKE)  -> +qty   (barang balik ke stok)
 * RETUR (RUSAK)-> 0      (barang tidak balik ke stok, cuma tercatat)
 * PENYESUAIAN  -> qty    (qty sudah disimpan bertanda, bisa negatif)
 */
export function efekStok({ tipe, qty, kondisiRetur }: AktivitasEfekInput): number {
  switch (tipe) {
    case "MASUK":
      return qty;
    case "KELUAR":
    case "RUSAK":
      return -qty;
    case "RETUR":
      return kondisiRetur === "OKE" ? qty : 0;
    case "PENYESUAIAN":
      return qty;
    default:
      return 0;
  }
}
