export type BarangItem = {
  id: number;
  kode: string;
  nama: string;
  stokMin: number | null;
  aktif: boolean;
  stok: number;
  terakhirDiubah: string | null;
};

export type AktivitasItem = {
  id: number;
  barangId: number | null;
  barangKodeSnap: string | null;
  barangNamaSnap: string | null;
  tipe: "MASUK" | "KELUAR" | "RUSAK" | "RETUR" | "PENYESUAIAN";
  qty: number;
  kondisiRetur: "OKE" | "RUSAK" | null;
  keterangan: string | null;
  tanggalKejadian: string;
  createdAt: string;
  stokSetelah?: number;
  barang?: { id: number; kode: string; nama: string } | null;
};

export type AuditLogItem = {
  id: string; // prefixed "barang-<id>" atau "aktivitas-<id>" biar unik pas digabung
  sumber: "barang" | "aktivitas";
  aksi: "TAMBAH" | "EDIT" | "NONAKTIFKAN" | "AKTIFKAN" | "HAPUS";
  barangNama: string;
  detail: string;
  waktuPerubahan: string;
};
