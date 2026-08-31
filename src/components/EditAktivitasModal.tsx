"use client";

import { useEffect, useState, useRef } from "react";
import type { AktivitasItem } from "@/lib/types";

const TIPE_LABEL: Record<string, string> = {
  MASUK: "Masuk",
  KELUAR: "Keluar",
  RUSAK: "Rusak",
  RETUR: "Retur",
  PENYESUAIAN: "Penyesuaian",
};

type BarangRingkas = { id: number; kode: string; nama: string; stok: number };

export default function EditAktivitasModal({
  aktivitas,
  onClose,
  onSaved,
}: {
  aktivitas: AktivitasItem & { barangNama?: string; barangKode?: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [barangId, setBarangId] = useState<number | null>(aktivitas.barangId);
  const [barangLabel, setBarangLabel] = useState(
    `${aktivitas.barangNama} (${aktivitas.barangKode ?? ""})`,
  );
  const [gantiBarang, setGantiBarang] = useState(false);
  const [search, setSearch] = useState("");
  const [barangList, setBarangList] = useState<BarangRingkas[]>([]);

  const [qty, setQty] = useState(Math.abs(aktivitas.qty));
  const [tanggal, setTanggal] = useState(
    aktivitas.tanggalKejadian.slice(0, 10),
  );
  const [keterangan, setKeterangan] = useState(aktivitas.keterangan ?? "");
  const [kondisiRetur, setKondisiRetur] = useState<"OKE" | "RUSAK">(
    aktivitas.kondisiRetur ?? "OKE",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchToken = useRef(0);

  useEffect(() => {
    if (!gantiBarang) return;
    const myToken = ++searchToken.current;
    const timer = setTimeout(() => {
      fetch(`/api/barang?pageSize=100&search=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => {
          if (searchToken.current === myToken) setBarangList(d.data ?? []);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, gantiBarang]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/aktivitas/${aktivitas.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barangId,
        qty: aktivitas.tipe === "PENYESUAIAN" ? qty : Math.abs(qty),
        kondisiRetur: aktivitas.tipe === "RETUR" ? kondisiRetur : undefined,
        keterangan,
        tanggalKejadian: tanggal,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal menyimpan");
      return;
    }
    onSaved();
  };

  const hapus = async () => {
    if (!confirm("Hapus aktivitas ini?")) return;
    setSaving(true);
    const res = await fetch(`/api/aktivitas/${aktivitas.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal menghapus");
      return;
    }
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 font-display text-xl font-bold">
          Edit Aktivitas
        </div>
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
          <span>{TIPE_LABEL[aktivitas.tipe]}</span>
          <span title="Waktu asli disimpan ke sistem">
            Diinput:{" "}
            {new Date(aktivitas.createdAt).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-dangerbg px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Barang
        </label>
        {!gantiBarang ? (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-brandbg px-3 py-2 text-sm">
            <span className="font-semibold">{barangLabel}</span>
            <button
              onClick={() => setGantiBarang(true)}
              className="bg-transparent px-0 text-xs text-navy2 underline"
            >
              Ganti
            </button>
          </div>
        ) : (
          <div className="mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama barang"
              className="mb-1.5 w-full"
              autoFocus
            />
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {barangList.length === 0 && (
                <p className="py-2 text-center text-xs text-slate-400">
                  Barang tidak ditemukan.
                </p>
              )}
              {barangList.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBarangId(b.id);
                    setBarangLabel(`${b.nama} (${b.kode})`);
                    setGantiBarang(false);
                  }}
                  className="flex justify-between bg-brandbg px-2.5 py-1.5 text-left text-xs font-normal"
                >
                  <span>
                    {b.nama} ({b.kode})
                  </span>
                  <span className="text-slate-400">stok {b.stok}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Tanggal kejadian
        </label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="mb-3 w-full"
        />

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Qty
        </label>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="mb-3 w-full"
        />

        {aktivitas.tipe === "RETUR" && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setKondisiRetur("OKE")}
              className={
                kondisiRetur === "OKE"
                  ? "bg-ok text-white"
                  : "bg-brandbg text-slate-500"
              }
            >
              Masih oke
            </button>
            <button
              onClick={() => setKondisiRetur("RUSAK")}
              className={
                kondisiRetur === "RUSAK"
                  ? "bg-danger text-white"
                  : "bg-brandbg text-slate-500"
              }
            >
              Rusak
            </button>
          </div>
        )}

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          No. JO / Keterangan
        </label>
        <input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="mb-3 w-full"
        />

        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 bg-navy text-white disabled:opacity-60"
          >
            Simpan
          </button>
          <button
            onClick={hapus}
            disabled={saving}
            className="bg-dangerbg text-danger"
          >
            Hapus
          </button>
          <button onClick={onClose} className="bg-brandbg text-slate-500">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
