"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { efekStok } from "@/lib/efek";

type Tipe = "MASUK" | "KELUAR" | "RUSAK" | "RETUR";

const LABEL: Record<Tipe, string> = {
  MASUK: "Masuk",
  KELUAR: "Keluar",
  RUSAK: "Rusak",
  RETUR: "Retur",
};
const WARNA: Record<Tipe, string> = {
  MASUK: "bg-ok text-white",
  KELUAR: "bg-amber text-navy",
  RUSAK: "bg-danger text-white",
  RETUR: "bg-navy2 text-white",
};

type BarangRingkas = {
  id: number;
  kode: string;
  nama: string;
  stok: number;
  stokMin: number | null;
};

export default function TambahAktivitasModal({
  allowedTipe,
  preselected,
  onClose,
  onSaved,
}: {
  allowedTipe: Tipe[];
  preselected?: {
    id: number;
    kode: string;
    nama: string;
    stok: number;
    stokMin: number | null;
  };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tipe, setTipe] = useState<Tipe>(allowedTipe[0]);
  const [barangList, setBarangList] = useState<BarangRingkas[]>([]);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<BarangRingkas | null>(
    preselected ?? null,
  );
  const [tanggal, setTanggal] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [qty, setQty] = useState(1);
  const [kondisiRetur, setKondisiRetur] = useState<"OKE" | "RUSAK">("OKE");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchToken = useRef(0);

  useEffect(() => {
    if (preselected) return;
    const myToken = ++searchToken.current;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ pageSize: "100", search });
      if (!search) params.set("sort", "recent");
      fetch(`/api/barang?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (searchToken.current === myToken) setBarangList(d.data ?? []);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, preselected]);

  const stokJadi = useMemo(() => {
    if (!picked) return null;
    return (
      picked.stok +
      efekStok({
        tipe,
        qty: Number(qty) || 0,
        kondisiRetur: tipe === "RETUR" ? kondisiRetur : null,
      })
    );
  }, [picked, tipe, qty, kondisiRetur]);

  const submit = async () => {
    if (!picked || saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/aktivitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barangId: picked.id,
        tipe,
        qty: Number(qty),
        kondisiRetur: tipe === "RETUR" ? kondisiRetur : undefined,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 font-display text-xl font-bold">
          {preselected ? "Catat Aktivitas" : "Tambah Aktivitas"}
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-dangerbg px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        <div
          className={`mb-3 grid gap-1.5`}
          style={{ gridTemplateColumns: `repeat(${allowedTipe.length}, 1fr)` }}
        >
          {allowedTipe.map((t) => (
            <button
              key={t}
              onClick={() => setTipe(t)}
              className={tipe === t ? WARNA[t] : "bg-brandbg text-slate-500"}
            >
              {LABEL[t]}
            </button>
          ))}
        </div>

        {!preselected && !picked ? (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Barang
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama barang"
              className="mb-2 w-full"
              autoFocus
            />
            <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto">
              {barangList.length === 0 && (
                <p className="py-3 text-center text-xs text-slate-400">
                  Barang tidak ditemukan.
                </p>
              )}
              {barangList.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setPicked(b)}
                  className="flex items-center justify-between bg-brandbg px-3 py-2 text-left text-sm font-normal"
                >
                  <span>
                    {b.nama}{" "}
                    <span className="text-xs text-slate-500">({b.kode})</span>
                  </span>
                  <span className="text-xs text-slate-500">stok {b.stok}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {!preselected && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-brandbg px-3 py-2 text-sm">
                <span>
                  <span className="font-semibold">{picked?.nama}</span>{" "}
                  <span className="text-xs text-slate-500">
                    ({picked?.kode})
                  </span>
                </span>
                <button
                  onClick={() => setPicked(null)}
                  className="bg-transparent px-0 text-xs text-navy2 underline"
                >
                  Ganti
                </button>
              </div>
            )}
            <div className="mb-2 flex items-center justify-between rounded-lg bg-brandbg px-3 py-2 text-xs">
              <span className="text-slate-500">Stok saat ini</span>
              <span className="font-semibold">{picked?.stok} pcs</span>
            </div>
            {picked?.stokMin !== null && picked?.stokMin !== undefined && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-brandbg px-3 py-2 text-xs">
                <span className="text-slate-500">Stok minimum</span>
                <span className="font-semibold">{picked.stokMin} pcs</span>
              </div>
            )}

            <div className="mb-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Tanggal kejadian
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Qty
                </label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {tipe === "RETUR" && (
              <div className="mb-2 grid grid-cols-2 gap-2">
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

            {stokJadi !== null && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-amber/10 px-3 py-2 text-sm">
                <span className="text-slate-500">Stok jadi</span>
                <span
                  className={`font-semibold ${stokJadi < 0 ? "text-danger" : ""}`}
                >
                  {stokJadi} pcs
                </span>
              </div>
            )}

            <label className="mb-1 block text-xs font-semibold text-slate-500">
              No. JO / Keterangan
            </label>
            <input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={
                tipe === "KELUAR" ? "JO-1108 (opsional)" : "Catatan (opsional)"
              }
              className="mb-3 w-full"
            />

            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={saving}
                className="flex-1 bg-navy text-white disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-brandbg text-slate-500"
              >
                Batal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
