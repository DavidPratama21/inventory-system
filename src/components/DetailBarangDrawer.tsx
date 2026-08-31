"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import TambahAktivitasModal from "./TambahAktivitasModal";
import TambahBarangModal from "./TambahBarangModal";

const TIPE_LABEL: Record<string, string> = {
  MASUK: "Masuk",
  KELUAR: "Keluar",
  RUSAK: "Rusak",
  RETUR: "Retur",
  PENYESUAIAN: "Penyesuaian",
};

export default function DetailBarangDrawer({
  barangId,
  onClose,
  onChanged,
}: {
  barangId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [showAktivitas, setShowAktivitas] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = () => {
    fetch(`/api/barang/${barangId}/riwayat`)
      .then((r) => r.json())
      .then(setData);
  };

  useEffect(load, [barangId]);

  const toggleStatus = async () => {
    if (!data) return;
    await fetch(`/api/barang/${barangId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktif: !data.barang.aktif }),
    });
    load();
    onChanged();
  };

  const hapusPermanen = async () => {
    if (!confirm(`Hapus permanen "${data.barang.nama}"? Aktivitas lama akan tetap ada dengan nama ini sebagai catatan.`)) return;
    await fetch(`/api/barang/${barangId}`, { method: "DELETE" });
    onChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-brandbg p-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="mb-3 bg-transparent px-0 text-sm text-slate-500">
          ← Tutup
        </button>

        {!data ? (
          <p className="py-16 text-center text-sm text-slate-500">Memuat...</p>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="font-display text-2xl font-bold">{data.barang.nama}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {data.barang.kode} ·{" "}
                  <span className={data.barang.aktif ? "text-ok font-semibold" : "text-slate-400 font-semibold"}>
                    {data.barang.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                <button onClick={() => setShowEdit(true)} className="bg-white text-xs shadow-sm">
                  Edit
                </button>
                <button onClick={toggleStatus} className="bg-white text-xs shadow-sm">
                  {data.barang.aktif ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button onClick={hapusPermanen} className="bg-dangerbg text-xs text-danger">
                  Hapus
                </button>
                <button onClick={() => setShowAktivitas(true)} className="bg-navy text-xs text-white">
                  + Catat Aktivitas
                </button>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="card p-3">
                <div className="text-xs text-slate-500">Stok saat ini</div>
                <div className="font-display text-2xl font-bold">{data.stok} pcs</div>
              </div>
              <div className="card p-3">
                <div className="text-xs text-slate-500">Stok minimum</div>
                <div className="font-display text-2xl font-bold">{data.barang.stokMin ?? "-"}</div>
              </div>
            </div>

            <div className="mb-4 card p-4">
              <div className="mb-2 text-sm font-semibold">Pergerakan stok · 30 hari</div>
              {data.grafik.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada aktivitas 30 hari terakhir.</p>
              ) : (
                <div style={{ width: "100%", height: 140 }}>
                  <ResponsiveContainer>
                    <LineChart data={data.grafik}>
                      <XAxis
                        dataKey="tanggal"
                        tickFormatter={(v) => new Date(v).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                        fontSize={11}
                      />
                      <YAxis fontSize={11} width={30} />
                      <Tooltip
                        labelFormatter={(v) => new Date(v).toLocaleDateString("id-ID")}
                        formatter={(v: number) => [`${v} pcs`, "Stok"]}
                      />
                      <Line type="monotone" dataKey="stok" stroke="#0A2643" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card p-4">
              <div className="mb-2 text-sm font-semibold">Riwayat barang ini</div>
              <div className="flex flex-col gap-2">
                {data.riwayat.length === 0 && <p className="text-xs text-slate-400">Belum ada riwayat.</p>}
                {data.riwayat.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                    <div>
                      <span className="font-semibold">{TIPE_LABEL[r.tipe]}</span>{" "}
                      <span className="text-slate-500">
                        {new Date(r.tanggalKejadian).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                      </span>
                      {r.keterangan && <div className="text-xs text-slate-400">{r.keterangan}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{r.qty > 0 ? `+${r.qty}` : r.qty}</div>
                      <div className="text-xs text-slate-400">jadi {r.stokSetelah}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {showAktivitas && data && (
          <TambahAktivitasModal
            allowedTipe={["MASUK", "KELUAR", "RUSAK", "RETUR"]}
            preselected={{ id: data.barang.id, kode: data.barang.kode, nama: data.barang.nama, stok: data.stok, stokMin: data.barang.stokMin }}
            onClose={() => setShowAktivitas(false)}
            onSaved={() => {
              setShowAktivitas(false);
              load();
              onChanged();
            }}
          />
        )}

        {showEdit && data && (
          <TambahBarangModal
            editing={data.barang}
            onClose={() => setShowEdit(false)}
            onSaved={() => {
              setShowEdit(false);
              load();
              onChanged();
            }}
          />
        )}
      </div>
    </div>
  );
}
