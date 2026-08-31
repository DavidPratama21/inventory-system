"use client";

import { SEMUA_KOLOM, type KolomKey } from "@/lib/laporanColumns";

export default function AturKolomPopover({
  kolom,
  onChange,
  onClose,
}: {
  kolom: KolomKey[];
  onChange: (k: KolomKey[]) => void;
  onClose: () => void;
}) {
  const toggle = (key: KolomKey) => {
    if (kolom.includes(key)) onChange(kolom.filter((k) => k !== key));
    else onChange([...kolom, key]);
  };

  const move = (key: KolomKey, dir: -1 | 1) => {
    const idx = kolom.indexOf(key);
    const target = idx + dir;
    if (target < 0 || target >= kolom.length) return;
    const next = [...kolom];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 font-display text-lg font-bold">Atur Kolom</div>
        <div className="mb-2 text-xs text-slate-500">Centang kolom yang mau ditampilkan, urutkan pakai panah.</div>
        <div className="flex flex-col gap-1.5">
          {SEMUA_KOLOM.map((c) => {
            const dipilih = kolom.includes(c.key);
            return (
              <div key={c.key} className="flex items-center gap-2 rounded-lg bg-brandbg px-2.5 py-1.5">
                <input type="checkbox" checked={dipilih} onChange={() => toggle(c.key)} />
                <span className="flex-1 text-sm">{c.label}</span>
                {dipilih && (
                  <div className="flex gap-1">
                    <button onClick={() => move(c.key, -1)} className="bg-transparent px-1 text-xs">↑</button>
                    <button onClick={() => move(c.key, 1)} className="bg-transparent px-1 text-xs">↓</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-3 w-full bg-navy text-white">
          Selesai
        </button>
      </div>
    </div>
  );
}
