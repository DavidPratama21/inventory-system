"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-brandbg">
      {/* Sidebar tetap terlihat di layar besar */}
      <div className="relative hidden md:block">
        <Sidebar collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-xs shadow-md hover:bg-brandbg"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Sidebar overlay untuk mobile */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar hanya muncul di mobile */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} className="bg-transparent px-1 text-xl">
            ☰
          </button>
          <span className="font-display text-lg font-bold text-navy">
            SHIBA <span className="text-amber">GUDANG</span>
          </span>
        </div>
        <div className="flex-1 p-4 md:p-7">{children}</div>
      </div>
    </div>
  );
}
