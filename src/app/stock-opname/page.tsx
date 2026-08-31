"use client";

import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

type Row = { id: number; kode: string; nama: string; stok: number };

export default function StockOpnamePage() {
  const [tanggal, setTanggal] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [semuaBarang, setSemuaBarang] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"nama" | "kode" | "belumDiisi">("nama");
  const [isian, setIsian] = useState<
    Record<number, { stokFisik: string; keterangan: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasil, setHasil] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/barang?pageSize=500`)
      .then((r) => r.json())
      .then((d) => setSemuaBarang(d.data.filter((b: any) => b.aktif)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = semuaBarang
    .filter((b) =>
      `${b.nama} ${b.kode}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "kode") return a.kode.localeCompare(b.kode);
      if (sortBy === "belumDiisi") {
        const aDiisi =
          isian[a.id]?.stokFisik !== undefined && isian[a.id]?.stokFisik !== "";
        const bDiisi =
          isian[b.id]?.stokFisik !== undefined && isian[b.id]?.stokFisik !== "";
        if (aDiisi !== bDiisi) return aDiisi ? 1 : -1; // yang belum diisi duluan
        return a.nama.localeCompare(b.nama);
      }
      return a.nama.localeCompare(b.nama);
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setStokFisik = (id: number, v: string) =>
    setIsian((prev) => ({
      ...prev,
      [id]: { stokFisik: v, keterangan: prev[id]?.keterangan ?? "" },
    }));
  const setKeterangan = (id: number, v: string) =>
    setIsian((prev) => ({
      ...prev,
      [id]: { stokFisik: prev[id]?.stokFisik ?? "", keterangan: v },
    }));

  const jumlahTerisi = Object.values(isian).filter(
    (v) => v.stokFisik !== "",
  ).length;

  const submit = async () => {
    const items = Object.entries(isian)
      .filter(([, v]) => v.stokFisik !== "")
      .map(([barangId, v]) => ({
        barangId: Number(barangId),
        stokFisik: Number(v.stokFisik),
        keterangan: v.keterangan,
      }));

    if (items.length === 0) {
      setHasil("Belum ada barang yang diisi stok fisiknya.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/stock-opname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanggalOpname: tanggal, items }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setHasil(data.error ?? "Gagal menyimpan");
      return;
    }
    setHasil(
      `Opname tersimpan — ${data.jumlahDisesuaikan} barang disesuaikan.`,
    );
    setIsian({});
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Stock Opname</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Tanggal opname</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </div>
      </div>

      {hasil && (
        <div className="rounded-lg bg-okbg px-3 py-2 text-sm font-semibold text-ok">
          {hasil}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari kode atau nama barang"
          className="w-full max-w-xs"
        />
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="nama">Urutkan: Nama</option>
          <option value="kode">Urutkan: Kode</option>
          <option value="belumDiisi">Urutkan: Belum diisi dulu</option>
        </select>
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-3 py-2.5">Kode</th>
              <th className="px-3 py-2.5">Nama</th>
              <th className="px-3 py-2.5 text-right">Stok Sistem</th>
              <th className="px-3 py-2.5 text-right">Stok Fisik</th>
              <th className="px-3 py-2.5 text-right">Selisih</th>
              <th className="px-3 py-2.5">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  Memuat...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  Barang tidak ditemukan.
                </td>
              </tr>
            ) : (
              paged.map((b) => {
                const fisikStr = isian[b.id]?.stokFisik ?? "";
                const fisik = fisikStr === "" ? null : Number(fisikStr);
                const selisih = fisik === null ? null : fisik - b.stok;
                return (
                  <tr
                    key={b.id}
                    className={`border-b border-slate-100 ${selisih ? (selisih < 0 ? "bg-dangerbg" : "bg-okbg") : ""}`}
                  >
                    <td className="px-3 py-2 text-slate-500">{b.kode}</td>
                    <td className="px-3 py-2">{b.nama}</td>
                    <td className="px-3 py-2 text-right text-slate-500">
                      {b.stok}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={fisikStr}
                        onChange={(e) => setStokFisik(b.id, e.target.value)}
                        placeholder="-"
                        className="w-20 text-right"
                      />
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-semibold ${selisih && selisih < 0 ? "text-danger" : selisih ? "text-ok" : "text-slate-300"}`}
                    >
                      {selisih === null
                        ? "-"
                        : selisih > 0
                          ? `+${selisih}`
                          : selisih}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={isian[b.id]?.keterangan ?? ""}
                        onChange={(e) => setKeterangan(b.id, e.target.value)}
                        placeholder="-"
                        className="w-full"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {jumlahTerisi} barang sudah diisi (semua halaman)
        </span>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>
            {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
          </span>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="bg-white shadow-sm disabled:opacity-40"
          >
            ‹
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="bg-white shadow-sm disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="bg-navy text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Opname"}
        </button>
      </div>
    </div>
  );
}
