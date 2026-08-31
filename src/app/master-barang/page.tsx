"use client";

import { useEffect, useState } from "react";
import TambahBarangModal from "@/components/TambahBarangModal";
import DetailBarangDrawer from "@/components/DetailBarangDrawer";
import type { BarangItem } from "@/lib/types";

const PAGE_SIZE = 20;

type SortBy = "kode" | "nama" | "terakhirDiubah" | "status";

export default function MasterBarangPage() {
  const [data, setData] = useState<BarangItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("nama");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState("");
  const [stokMenipisFilter, setStokMenipisFilter] = useState(false);
  const [showTambah, setShowTambah] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      search,
      sortBy,
      sortDir,
    });
    if (statusFilter) params.set("status", statusFilter);
    if (stokMenipisFilter) params.set("stokMenipis", "1");
    fetch(`/api/barang?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, sortBy, sortDir, statusFilter, stokMenipisFilter]);

  const toggleSort = (kolom: SortBy) => {
    if (sortBy === kolom) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(kolom);
      setSortDir("asc");
    }
    setPage(1);
  };

  const sortIcon = (kolom: SortBy) => (sortBy === kolom ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  const toggleStatus = async (b: BarangItem) => {
    await fetch(`/api/barang/${b.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktif: !b.aktif }),
    });
    load();
  };

  const hapusPermanen = async (b: BarangItem) => {
    if (!confirm(`Hapus permanen "${b.nama}"?`)) return;
    await fetch(`/api/barang/${b.id}`, { method: "DELETE" });
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Master Barang</h1>
          <p className="text-sm text-slate-500">{total} jenis barang{statusFilter || stokMenipisFilter || search ? " (terfilter)" : ""}</p>
        </div>
        <button onClick={() => setShowTambah(true)} className="bg-navy text-white">
          + Tambah Barang
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari kode atau nama barang"
          className="w-full max-w-xs"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Semua status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        <label className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
          <input
            type="checkbox"
            checked={stokMenipisFilter}
            onChange={(e) => { setStokMenipisFilter(e.target.checked); setPage(1); }}
          />
          Stok menipis
        </label>
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-3 py-2.5">No</th>
              <th className="cursor-pointer select-none px-3 py-2.5 hover:text-navy" onClick={() => toggleSort("kode")}>
                Kode{sortIcon("kode")}
              </th>
              <th className="cursor-pointer select-none px-3 py-2.5 hover:text-navy" onClick={() => toggleSort("nama")}>
                Nama{sortIcon("nama")}
              </th>
              <th className="px-3 py-2.5 text-right">Stok</th>
              <th className="px-3 py-2.5 text-right">Min</th>
              <th className="cursor-pointer select-none px-3 py-2.5 hover:text-navy" onClick={() => toggleSort("status")}>
                Status{sortIcon("status")}
              </th>
              <th
                className="cursor-pointer select-none px-3 py-2.5 hover:text-navy"
                onClick={() => toggleSort("terakhirDiubah")}
              >
                Terakhir Diubah{sortIcon("terakhirDiubah")}
              </th>
              <th className="px-3 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-10 text-center text-slate-500">Memuat...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="py-10 text-center text-slate-500">Tidak ada barang yang cocok.</td></tr>
            ) : (
              data.map((b, i) => {
                const low = b.stokMin !== null && b.stok <= b.stokMin;
                return (
                  <tr
                    key={b.id}
                    className={`cursor-pointer border-b border-slate-100 hover:bg-brandbg/60 ${
                      !b.aktif ? "opacity-50" : low ? "bg-dangerbg" : ""
                    }`}
                    onClick={() => setSelectedId(b.id)}
                  >
                    <td className="px-3 py-2 text-slate-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-3 py-2">{b.kode}</td>
                    <td className="px-3 py-2 font-medium">{b.nama}</td>
                    <td className={`px-3 py-2 text-right ${low ? "font-semibold text-danger" : ""}`}>{b.stok}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{b.stokMin ?? "-"}</td>
                    <td className="px-3 py-2">
                      <span className={b.aktif ? "text-ok" : "text-slate-400"}>{b.aktif ? "Aktif" : "Nonaktif"}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {b.terakhirDiubah
                        ? new Date(b.terakhirDiubah).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
                        : "-"}
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 text-base">
                        <button
                          onClick={() => setSelectedId(b.id)}
                          title="Edit"
                          className="bg-transparent px-0 text-slate-500 hover:text-navy"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => toggleStatus(b)}
                          title={b.aktif ? "Nonaktifkan" : "Aktifkan"}
                          className="bg-transparent px-0 text-slate-500 hover:text-navy"
                        >
                          {b.aktif ? "🚫" : "✅"}
                        </button>
                        <button
                          onClick={() => hapusPermanen(b)}
                          title="Hapus permanen"
                          className="bg-transparent px-0 text-slate-500 hover:text-danger"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 text-sm text-slate-500">
        <span>
          {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} dari {total}
        </span>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="bg-white shadow-sm disabled:opacity-40">
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

      {showTambah && (
        <TambahBarangModal
          onClose={() => setShowTambah(false)}
          onSaved={() => {
            setShowTambah(false);
            load();
          }}
        />
      )}

      {selectedId !== null && (
        <DetailBarangDrawer barangId={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />
      )}
    </div>
  );
}
