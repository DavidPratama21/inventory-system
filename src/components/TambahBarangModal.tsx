"use client";

import { useState } from "react";

type BarangEdit = { id: number; kode: string; nama: string; stokMin: number | null };

export default function TambahBarangModal({
  editing,
  onClose,
  onSaved,
}: {
  editing?: BarangEdit | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kode, setKode] = useState(editing?.kode ?? "");
  const [nama, setNama] = useState(editing?.nama ?? "");
  const [stokMin, setStokMin] = useState(editing?.stokMin?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (saving) return;
    if (!kode.trim() || !nama.trim()) {
      setError("Kode dan nama wajib diisi");
      return;
    }
    setSaving(true);
    setError(null);
    const url = editing ? `/api/barang/${editing.id}` : "/api/barang";
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode, nama, stokMin: stokMin === "" ? null : Number(stokMin) }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 font-display text-xl font-bold">{editing ? "Edit Barang" : "Tambah Barang"}</div>

        {error && <div className="mb-3 rounded-lg bg-dangerbg px-3 py-2 text-sm font-semibold text-danger">{error}</div>}

        <label className="mb-1 block text-xs font-semibold text-slate-500">Kode barang</label>
        <input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="SK-PC200-B" className="mb-3 w-full" />

        <label className="mb-1 block text-xs font-semibold text-slate-500">Nama barang</label>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Seal kit boom PC200"
          className="mb-3 w-full"
        />

        <label className="mb-1 block text-xs font-semibold text-slate-400">Stok minimum (opsional)</label>
        <input
          type="number"
          min={0}
          value={stokMin}
          onChange={(e) => setStokMin(e.target.value)}
          placeholder="0"
          className="mb-2 w-full"
        />
        {!editing && (
          <p className="mb-3 text-xs text-slate-400">
            Stok awal akan 0 — catat lewat Tambah Aktivitas setelah barang disimpan.
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <button onClick={submit} disabled={saving} className="flex-1 bg-navy text-white disabled:opacity-60">
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <button onClick={onClose} className="flex-1 bg-brandbg text-slate-500">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
