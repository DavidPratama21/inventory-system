# 📦 Shiba Gudang — Sistem Inventory

Sistem inventory gudang PT Shiba Hidrolik Pratama untuk seal hidrolik & spare parts (±200-300 jenis barang).

**Stack:** Next.js 14 (App Router) · Prisma 5 · PostgreSQL (Supabase) · Tailwind CSS · Recharts · react-pdf
**Deploy:** Vercel (gratis) + Supabase (gratis) — 100% free tier, cukup untuk 1-3 pengguna

## Fitur

- **Dashboard** — panel Aktivitas (tambah + daftar terbaru) & panel Stok Menipis, kartu ringkasan
- **Master Barang** — tabel stok real-time + kelola barang, klik baris untuk buka panel Detail Barang (grafik pergerakan 30 hari + riwayat khusus barang itu + catat aktivitas)
- **Riwayat** — semua aktivitas (Masuk/Keluar/Rusak/Retur/Penyesuaian), filter tanggal & tipe & nama barang, kolom Stok Setelah (running balance), bisa diedit/dihapus
- **Stock Opname** — bandingkan stok sistem vs stok fisik, otomatis bikin Aktivitas Penyesuaian untuk yang beda, pagination tanpa reset data (bisa dikerjakan bertahap)
- **Laporan** — bulanan, preset Stok Akhir / Pergerakan, kolom bisa dicentang & diurutkan, download PDF (kop Shiba, siap print)
- **Riwayat Perubahan** — audit log gabungan (tambah/edit/nonaktifkan/hapus barang + edit/hapus aktivitas), menyimpan nilai lama sebelum berubah

Barang bisa **Nonaktifkan** (reversible) atau **Hapus Permanen** (aktivitas lama tetap ada dengan nama barang dicatat sebagai teks).

Stok tidak pernah disimpan sebagai angka — selalu dihitung dari total Aktivitas. Rumus: `Masuk + Retur(oke) + Penyesuaian − Keluar − Rusak`.

## Setup Lokal

### 1. Bikin database di Supabase (gratis)

1. Daftar/login di [supabase.com](https://supabase.com) → **New Project**
2. Masuk **Project Settings → Database → Connection String**, ambil dua URL:
   - **Transaction pooler** (port 6543) → `DATABASE_URL`, tambahin `?pgbouncer=true`
   - **Session pooler** (port 5432) → `DIRECT_URL`

### 2. Setup project

```bash
npm install
cp .env.example .env
# isi DATABASE_URL & DIRECT_URL dari langkah 1

npx prisma db push     # bikin tabel di Supabase
npm run dev            # buka http://localhost:3000
```

### 3. Mulai pakai

1. **Master Barang** → tambah beberapa barang dulu
2. **Dashboard** → catat barang masuk pertama lewat "+ Tambah Aktivitas"
3. Klik barangnya di Master Barang → lihat detail, grafik, dan riwayatnya

## Deploy ke Vercel (gratis)

1. Push ke GitHub
2. [vercel.com](https://vercel.com) → **Add New Project** → import repo
3. Tambahin env var `DATABASE_URL` dan `DIRECT_URL`
4. Deploy — build otomatis jalanin `prisma generate`

Catatan: Supabase free tier auto-pause kalau 7 hari gak diakses — tinggal klik resume, data gak hilang.

## Struktur Project

```
prisma/schema.prisma              # Barang, Aktivitas, BarangAuditLog, AktivitasAuditLog
src/lib/efek.ts                   # hitung efek satu aktivitas ke stok (signed)
src/lib/stock.ts                  # agregasi stok, stok setelah, terakhir diubah
src/lib/laporanColumns.ts         # definisi kolom laporan & preset
src/app/api/                      # semua endpoint (barang, aktivitas, dashboard, laporan, stock-opname, riwayat-perubahan)
src/app/dashboard|master-barang|riwayat|stock-opname|laporan|riwayat-perubahan/
src/components/                   # Sidebar, AppShell, modal-modal, DetailBarangDrawer, ReportDoc (PDF)
```

## Belum termasuk (next step)

- [ ] Login/auth admin vs staff (sengaja ditunda)
- [ ] Struktur kategori barang (kolom sudah ada, form disembunyikan)
- [ ] Import Excel massal (untuk sekarang input manual satu-satu)

## Catatan jujur

Kode ini ditulis dengan hati-hati mengikuti seluruh spesifikasi yang sudah disepakati, tapi belum bisa dites jalan langsung dari lingkungan pembuatannya (Prisma butuh koneksi database sungguhan). Kalau ada error saat `npm run dev` atau `npx prisma db push`, tempel pesan errornya untuk dibetulkan bersama.
