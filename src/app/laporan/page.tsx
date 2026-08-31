"use client";

import { useEffect, useState } from "react";
import AturKolomPopover from "@/components/AturKolomPopover";
import {
  SEMUA_KOLOM,
  PRESET_STOK_AKHIR,
  PRESET_PERGERAKAN,
  BATAS_AMAN_KOLOM,
  ambilNilaiKolom,
  type KolomKey,
} from "@/lib/laporanColumns";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function LaporanPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [kolom, setKolom] = useState<KolomKey[]>(PRESET_STOK_AKHIR);
  const [showAtur, setShowAtur] = useState(false);
  const [periode, setPeriode] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/laporan?month=${bulan}&year=${tahun}`)
      .then((r) => r.json())
      .then((d) => {
        setPeriode(d.periode ?? "");
        setRows(d.rows ?? []);
      })
      .finally(() => setLoading(false));
  }, [bulan, tahun]);

  const tahunOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

  const downloadPdf = async () => {
    if (downloading || rows.length === 0) return;
    setDownloading(true);
    try {
      const [{ pdf }, { ReportDoc }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/ReportDoc"),
      ]);
      const generatedAt = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
      const blob = await pdf(<ReportDoc periode={periode} rows={rows} kolom={kolom} generatedAt={generatedAt} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan-Stok-${tahun}-${String(bulan).padStart(2, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Laporan</h1>
        <div className="flex gap-2">
          <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
            {NAMA_BULAN.map((b, i) => (
              <option key={b} value={i + 1}>{b}</option>
            ))}
          </select>
          <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {tahunOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setKolom(PRESET_STOK_AKHIR)}
            className={JSON.stringify(kolom) === JSON.stringify(PRESET_STOK_AKHIR) ? "bg-navy text-white" : "bg-white shadow-sm"}
          >
            Stok Akhir
          </button>
          <button
            onClick={() => setKolom(PRESET_PERGERAKAN)}
            className={JSON.stringify(kolom) === JSON.stringify(PRESET_PERGERAKAN) ? "bg-navy text-white" : "bg-white shadow-sm"}
          >
            Pergerakan
          </button>
          <button onClick={() => setShowAtur(true)} className="bg-white shadow-sm">
            ⚙️ Atur Kolom
          </button>
        </div>
        <button onClick={downloadPdf} disabled={downloading || rows.length === 0} className="bg-navy text-white disabled:opacity-50">
          {downloading ? "Menyiapkan PDF..." : "⬇ Download PDF"}
        </button>
      </div>

      {kolom.length > BATAS_AMAN_KOLOM && (
        <div className="rounded-lg bg-dangerbg px-3 py-2 text-sm font-semibold text-danger">
          ⚠️ Kolom yang dipilih ({kolom.length}) kemungkinan gak muat rapi di lebar A4 portrait — pertimbangkan kurangi kolomnya.
        </div>
      )}

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              {kolom.map((k) => (
                <th key={k} className="px-3 py-2.5">{SEMUA_KOLOM.find((c) => c.key === k)?.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={kolom.length} className="py-10 text-center text-slate-500">Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={kolom.length} className="py-10 text-center text-slate-500">Tidak ada data periode ini.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.kode} className="border-b border-slate-100">
                  {kolom.map((k) => (
                    <td key={k} className="px-3 py-2">{ambilNilaiKolom(r, k, i + 1)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-center text-xs text-slate-400">Preview mengikuti tampilan A4 yang akan dicetak. Periode: {periode}</p>

      {showAtur && <AturKolomPopover kolom={kolom} onChange={setKolom} onClose={() => setShowAtur(false)} />}
    </div>
  );
}
