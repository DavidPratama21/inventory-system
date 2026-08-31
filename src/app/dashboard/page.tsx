"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TambahAktivitasModal from "@/components/TambahAktivitasModal";

const TIPE_LABEL: Record<string, string> = { MASUK: "masuk", KELUAR: "keluar", RUSAK: "rusak", RETUR: "retur" };

function fmtJam(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function fmtTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [detailTipe, setDetailTipe] = useState<"MASUK" | "KELUAR" | null>(null);
  const [detailData, setDetailData] = useState<any[] | null>(null);

  const load = () => {
    fetch("/api/dashboard").then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    })
    .then(setData)
    .catch((e) => console.error("Dashboard error:", e))
  };
  useEffect(load, []);

  const bukaDetail = (tipe: "MASUK" | "KELUAR") => {
    setDetailTipe(tipe);
    setDetailData(null);
    fetch(`/api/dashboard/detail?tipe=${tipe}`)
      .then((r) => r.json())
      .then((d) => setDetailData(d.data));
  };

  if (!data) return <p className="py-16 text-center text-sm text-slate-500">Memuat dashboard...</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card label="Jenis Barang" value={data.totalBarang} />
        <Card
          label="Masuk Bulan Ini"
          value={data.masukBulanIni}
          accent="text-ok"
          onDetail={() => bukaDetail("MASUK")}
        />
        <Card
          label="Keluar Bulan Ini"
          value={data.keluarBulanIni}
          accent="text-amber"
          onDetail={() => bukaDetail("KELUAR")}
        />
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-xl font-bold">Aktivitas</div>
          <button onClick={() => setShowModal(true)} className="bg-navy text-white">
            + Tambah Aktivitas
          </button>
        </div>
        {data.aktivitasTerbaru.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada aktivitas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.aktivitasTerbaru.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-sm last:border-0"
              >
                <span className="w-12 shrink-0 text-xs text-slate-400" title="Waktu input ke sistem">
                  {fmtJam(a.createdAt)}
                </span>
                <span className="flex-1">
                  <span className="font-semibold">{a.barangNama}</span> · {TIPE_LABEL[a.tipe] ?? a.tipe} {a.qty}
                  {a.keterangan && <span className="text-slate-400"> · {a.keterangan}</span>}
                </span>
                <span className="shrink-0 text-xs text-slate-400">{fmtTanggal(a.tanggalKejadian)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 text-right">
          <Link href="/riwayat" className="text-sm font-semibold text-navy2 hover:underline">
            Lihat semua aktivitas →
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-dangerbg p-5">
        <div className="mb-3 font-display text-lg font-bold text-danger">Stok Menipis ({data.stokMenipis.length})</div>
        {data.stokMenipis.length === 0 ? (
          <p className="text-sm text-slate-600">Aman, semua stok di atas minimum. 👍</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.stokMenipis.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>{b.nama}</span>
                <span className="font-semibold text-danger">
                  {b.stok} / min {b.stokMin}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <TambahAktivitasModal
          allowedTipe={["MASUK", "KELUAR"]}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {detailTipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailTipe(null)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 font-display text-xl font-bold">
              Detail {detailTipe === "MASUK" ? "Masuk" : "Keluar"} Bulan Ini
            </div>
            {!detailData ? (
              <p className="text-sm text-slate-500">Memuat...</p>
            ) : detailData.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada aktivitas bulan ini.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {detailData.map((d) => (
                  <div key={d.kode} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                    <span>
                      {d.nama} <span className="text-xs text-slate-400">({d.kode})</span>
                    </span>
                    <span className="font-semibold">{d.total}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setDetailTipe(null)} className="mt-4 w-full bg-brandbg text-slate-500">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  accent,
  onDetail,
}: {
  label: string;
  value: number;
  accent?: string;
  onDetail?: () => void;
}) {
  return (
    <div className="card group relative p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-display text-3xl font-bold ${accent ?? "text-navy"}`}>{value}</div>
      {onDetail && (
        <button
          onClick={onDetail}
          className="absolute right-3 top-3 bg-transparent px-0 text-xs font-semibold text-navy2 opacity-0 transition-opacity group-hover:opacity-100"
        >
          Lihat Detail
        </button>
      )}
    </div>
  );
}
