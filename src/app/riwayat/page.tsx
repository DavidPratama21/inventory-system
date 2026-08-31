"use client";

import { useEffect, useState } from "react";
import EditAktivitasModal from "@/components/EditAktivitasModal";

const PAGE_SIZE = 20;
const TIPE_LABEL: Record<string, string> = {
  MASUK: "Masuk",
  KELUAR: "Keluar",
  RUSAK: "Rusak",
  RETUR: "Retur",
  PENYESUAIAN: "Penyesuaian",
};
const TIPE_WARNA: Record<string, string> = {
  MASUK: "bg-okbg text-ok",
  KELUAR: "bg-amber/20 text-amber-700",
  RUSAK: "bg-dangerbg text-danger",
  RETUR: "bg-navy/10 text-navy2",
  PENYESUAIAN: "bg-slate-200 text-slate-600",
};

export default function RiwayatPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tipe, setTipe] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (tipe) params.set("tipe", tipe);
    if (search) params.set("search", search);
    fetch(`/api/aktivitas?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, dateFrom, dateTo, tipe, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-bold">Riwayat</h1>

      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <span className="self-center text-sm text-slate-400">sampai</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={tipe}
          onChange={(e) => {
            setTipe(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua tipe</option>
          {Object.entries(TIPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nama barang"
          className="w-52"
        />
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-3 py-2.5">Tanggal Kejadian</th>
              <th className="px-3 py-2.5">Waktu Input</th>
              <th className="px-3 py-2.5">Kode</th>
              <th className="px-3 py-2.5">Barang</th>
              <th className="px-3 py-2.5">Tipe</th>
              <th className="px-3 py-2.5 text-right">Qty</th>
              <th className="px-3 py-2.5">No. JO / Ket.</th>
              <th className="px-3 py-2.5 text-right">Stok Setelah</th>
              <th className="px-3 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-500">
                  Memuat...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-500">
                  Belum ada aktivitas.
                </td>
              </tr>
            ) : (
              data.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(a.tanggalKejadian).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {new Date(a.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{a.barangKode}</td>
                  <td className="px-3 py-2">{a.barangNama}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TIPE_WARNA[a.tipe]}`}
                    >
                      {TIPE_LABEL[a.tipe]}
                      {a.tipe === "RETUR" &&
                        a.kondisiRetur === "RUSAK" &&
                        " (rusak)"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{a.qty}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {a.keterangan ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {a.stokSetelah ?? "-"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setEditing(a)}
                      className="bg-transparent px-0 text-base"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 text-sm text-slate-500">
        <span>
          {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} dari{" "}
          {total}
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

      {editing && (
        <EditAktivitasModal
          aktivitas={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
