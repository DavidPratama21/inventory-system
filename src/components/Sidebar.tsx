"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/master-barang", label: "Master Barang", icon: "📦" },
  { href: "/riwayat", label: "Riwayat", icon: "🕐" },
  { href: "/stock-opname", label: "Stock Opname", icon: "📋" },
  { href: "/laporan", label: "Laporan", icon: "📄" },
  { href: "/riwayat-perubahan", label: "Riwayat Perubahan", icon: "🧾" },
];

// Cek exact match atau child path, TAPI tolak kalau ada menu lain yang lebih spesifik cocok.
// Ini nyegah "/riwayat-perubahan" ketuker aktif sebagai "/riwayat".
function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  const lebihSpesifikAda = MENU.some(
    (m) => m.href !== href && m.href.startsWith(href) && pathname.startsWith(m.href)
  );
  if (lebihSpesifikAda) return false;
  return pathname.startsWith(href + "/");
}

export default function Sidebar({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  return (
    <div className={`flex h-full flex-col bg-navy text-white transition-all ${collapsed ? "w-16" : "w-56"}`}>
      <div className="px-4 pb-2 pt-6">
        {collapsed ? (
          <div className="font-display text-2xl font-bold leading-none text-amber">S</div>
        ) : (
          <>
            <div className="font-display text-2xl font-bold leading-none tracking-wide">
              SHIBA <span className="text-amber">GUDANG</span>
            </div>
            <div className="mt-1 text-[11px] text-white/60">Hidrolik Pratama</div>
          </>
        )}
      </div>
      <nav className="mt-4 flex flex-col gap-1 px-2.5">
        {MENU.map((m) => {
          const active = isActive(pathname, m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              onClick={onNavigate}
              title={collapsed ? m.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-white/10 text-amber" : "text-white/75 hover:bg-white/5"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <span className="text-base leading-none">{m.icon}</span>
              {!collapsed && m.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
