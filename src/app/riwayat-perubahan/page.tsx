"use client";

import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

const JENIS_OPTIONS = [
  { value: "", label: "Semua jenis" },
  { value: "barang:TAMBAH", label: "Tambah Barang" },
  { value: "barang:EDIT", label: "Edit Barang" },
  { value: "barang:NONAKTIFKAN", label: "Nonaktifkan Barang" },
  { value: "barang:AKTIFKAN", label: "Aktifkan Barang" },
  { value: "barang:HAPUS", label: "Hapus Barang" },
  { value: "aktivitas:EDIT", label: "Edit Aktivitas" },
  { value: "aktivitas:HAPUS", label: "Hapus Aktivitas" },
];

const BADGE_WARNA: Record<string, string> = {
  TAMBAH: "bg-okbg text-ok",
  EDIT: "bg-navy/10 text-navy2",
  NONAKTIFKAN: "bg-slate-200 text-slate-600",
  AKTIFKAN: "bg-okbg text-ok",
  HAPUS: "bg-dangerbg text-danger",
};

export default function RiwayatPerubahanPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [jenis, setJenis] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (jenis) params.set("jenis", jenis);
    if (search) params.set("search", search);
    fetch(`/api/riwayat-perubahan?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, dateFrom, dateTo, jenis, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-bold">Riwayat Perubahan</h1>

      <div className="flex flex-wrap gap-2">
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        <span className="self-center text-sm text-slate-400">sampai</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        <select value={jenis} onChange={(e) => { setJenis(e.target.value); setPage(1); }}>
          {JENIS_OPTIONS.map((j) => (
            <option key={j.value} value={j.value}>{j.label}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari nama barang"
          className="w-52"
        />
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-3 py-2.5">Tanggal & Jam</th>
              <th className="px-3 py-2.5">Jenis</th>
              <th className="px-3 py-2.5">Barang</th>
              <th className="px-3 py-2.5">Detail Perubahan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-10 text-center text-slate-500">Memuat...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={4} className="py-10 text-center text-slate-500">Belum ada perubahan tercatat.</td></tr>
            ) : (
              data.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(l.waktuPerubahan).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_WARNA[l.aksi]}`}>
                      {l.sumber === "barang" ? "Barang" : "Aktivitas"} · {l.aksi}
                    </span>
                  </td>
                  <td className="px-3 py-2">{l.barangNama}</td>
                  <td className="px-3 py-2 text-slate-500">{l.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 text-sm text-slate-500">
        <span>{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} dari {total}</span>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="bg-white shadow-sm disabled:opacity-40">‹</button>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="bg-white shadow-sm disabled:opacity-40">›</button>
      </div>
    </div>
  );
}
