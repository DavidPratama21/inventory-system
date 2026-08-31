# Briefing Proyek — Shiba Gudang (Sistem Inventory)

Dokumen ini berisi konteks lengkap di balik desain sistem ini — bukan cuma "apa" tapi juga "kenapa". Ditulis supaya siapapun (manusia atau AI) yang lanjut mengerjakan project ini paham alasan di balik tiap keputusan, bukan cuma nurut ke kode yang sudah ada.

## 1. Ringkasan Proyek

Sistem inventory gudang untuk **PT Shiba Hidrolik Pratama** — perusahaan seal hidrolik & spare parts alat berat. Menggantikan pencatatan manual (kartu stok fisik → dipindah ke Google Sheets di akhir bulan) dengan sistem web internal.

**Skala:** ±200-300 jenis barang, dipakai 1-3 orang (pemilik/admin + 1-2 staff gudang).

**Constraint penting:** harus **100% gratis** selamanya (Vercel + Supabase free tier), bukan sekadar "gratis buat mulai". Ini bukan produk yang dijual, murni internal tool.

Project ini **standalone**, terpisah dari sistem "Shiba 2.0" (platform e-commerce Shiba yang sedang dikerjakan terpisah). Tidak ada rencana integrasi langsung — keduanya sengaja dipisah supaya masing-masing sederhana.

## 2. Kenapa Stack Ini

- **Next.js (App Router)**: frontend dan backend (API routes) jadi satu repo, satu deploy. Menghindari masalah yang dialami di project lain (Shiba 2.0) yang harus urus server Express terpisah di hosting cPanel dengan RAM terbatas.
- **Vercel**: serverless, tidak ada server yang perlu dinyalakan/di-maintain manual, cocok untuk trafik kecil (1-3 user).
- **Supabase**: PostgreSQL gratis, terpisah dari Vercel. Catatan: auto-pause kalau 7 hari tidak diakses — tinggal klik resume, data tidak hilang.
- **Prisma**: ORM, schema jadi satu sumber kebenaran untuk struktur data.
- **Desktop-first, bukan mobile-first**: pemakaian utama di laptop (bukan HP), jadi layout pakai sidebar kiri + tabel (bukan bottom-nav + card seperti aplikasi mobile). Tetap responsive turun ke HP sebagai mode sekunder.
- **Bahasa Indonesia** di seluruh UI.

## 3. Konteks Alur Kerja Gudang (Kenapa Desainnya Begini)

Ini bagian paling penting untuk dipahami sebelum mengubah apapun — desain data model mengikuti kenyataan lapangan, bukan sebaliknya:

- Staff mencatat barang masuk/keluar **fisik dulu** di kartu stok. Baru dipindah ke sistem — kadang langsung, kadang ditumpuk sampai akhir bulan.
- **Konsekuensi desain:** setiap Aktivitas punya `tanggalKejadian` (tanggal kejadian fisik sebenarnya) yang terpisah dari `createdAt` (kapan diinput ke sistem). Staff bisa input aktivitas bertanggal mundur.
- Kode barang **sudah ada** dari sistem Shiba lama (auto-generate), bukan dibuat baru oleh sistem ini.
- Beda ukuran barang = beda kode & baris sendiri (dikonfirmasi staff gudang). Beda merek juga dianggap beda kode, tapi kasusnya sangat jarang (pernah terjadi 1 kali).
- Lokasi rak tidak dipakai — pencarian barang di gudang murni manual/hafalan staff, jadi field ini sengaja tidak ada.
- Ada data Excel historis yang **suatu saat** perlu dimigrasikan, tapi belum sekarang — untuk saat ini asumsikan input manual satu-satu lewat form.
- Barang Keluar **selalu** ada nomor Job Order (dikonfirmasi staff) — makanya field ini wajib diisi khusus untuk tipe Keluar.
- Barang yang datang dari supplier dalam kondisi sudah rusak tetap dicatat sebagai **Masuk** (bukan tipe Rusak). Tipe **Rusak** khusus untuk barang yang rusak *selagi disimpan* di gudang.

## 4. Konsep Data Inti & Rasionalnya

### Stok tidak pernah disimpan sebagai angka

Ini prinsip paling fundamental di sistem ini. Kolom `stok` **sengaja tidak ada** di tabel Barang. Stok selalu dihitung ulang dari total semua Aktivitas terkait barang itu (lihat `src/lib/stock.ts` dan `src/lib/efek.ts`).

Alasan: kalau stok jadi kolom yang bisa diedit manual, riwayat dan angka stok bisa jadi tidak sinkron, dan kesalahan input tidak akan pernah ketahuan. Dengan stok = hasil hitung dari Aktivitas, stok dan riwayat **mustahil berbeda** — persis seperti saldo rekening bank yang dihitung dari mutasi, bukan angka yang diedit teller.

### 5 tipe Aktivitas dan efeknya ke stok

| Tipe | Efek ke stok | Catatan |
|---|---|---|
| Masuk | +qty | Dari supplier/PO |
| Keluar | −qty | Untuk Job Order, No. JO wajib diisi |
| Rusak | −qty | Barang rusak *selagi di gudang* (bukan barang yang datang sudah rusak) |
| Retur (kondisi Oke) | +qty | Barang balik ke stok |
| Retur (kondisi Rusak) | 0 | Tercatat tapi TIDAK mengubah stok (barang tidak balik) |
| Penyesuaian | ±qty (qty disimpan bertanda/signed) | Hasil dari Stock Opname, koreksi selisih fisik vs sistem |

Field `keterangan` menggabungkan No. Job Order dan catatan bebas jadi satu field saja (keputusan sengaja disederhanakan; bisa dipecah lagi kalau nanti ada komplain soal susah nyari berdasarkan nomor JO).

### Nonaktifkan vs Hapus Permanen

Barang punya dua cara "dihilangkan":
- **Nonaktifkan** (default, reversible) — barang disembunyikan dari pilihan aktivitas baru, tapi semua data & riwayat tetap utuh dan tetap ter-link.
- **Hapus Permanen** — barang beneran dihapus dari tabel Barang. Semua Aktivitas yang tadinya nyantol ke barang itu otomatis dapat *snapshot* nama & kode barang (ditulis sebagai teks biasa di kolom `barangNamaSnap`/`barangKodeSnap`), supaya riwayat lama tetap terbaca meski relasinya sudah putus (`barangId` jadi `null`).

### Audit log detail (bukan cuma timestamp)

Baik perubahan Barang (tambah/edit/nonaktifkan/aktifkan/hapus) maupun Aktivitas (edit/hapus) dicatat di tabel audit log terpisah (`BarangAuditLog`, `AktivitasAuditLog`), menyimpan **nilai lama dan baru** (kolom JSON `dataLama`/`dataBaru`), bukan cuma "kapan diubah". Ini keputusan sadar untuk jaga-jaga kebutuhan audit di masa depan, meski sistemnya sendiri masih sederhana (tidak ada login/multi-user roles).

Tidak ada field "siapa yang input/edit" di manapun — sengaja dihapus untuk menjaga sistem tetap simpel selama belum ada login.

### Riwayat "Stok Setelah" (running balance)

Kolom di halaman Riwayat yang menunjukkan stok barang tersebut *setelah* aktivitas itu terjadi. Dihitung dengan menjumlahkan efek semua Aktivitas barang yang sama, diurutkan berdasarkan `tanggalKejadian` (lalu `id` sebagai tie-breaker kalau tanggalnya sama). Lihat `getStokSetelah()` di `src/lib/stock.ts`.

## 5. Terminologi (Penting — Konsisten di Seluruh Kode)

- **"Barang"**, bukan "part" atau "produk"
- **"Aktivitas"**, bukan "transaksi" (nama tabel: `Aktivitas`, tapi konsepnya sama seperti "transaction log")
- Tombol tambah aktivitas dinamakan **"Tambah Aktivitas"** (di Dashboard) dan **"Catat Aktivitas"** (di panel Detail Barang)
- Semua satuan barang diasumsikan **"pcs"** — tidak ada field satuan yang bisa dipilih/diubah

## 6. Spesifikasi & Rasional per Halaman

### Dashboard (halaman utama)
Sengaja dibuat **ringkas**, dua panel utama:
- **Panel Aktivitas**: gabungan tombol "+ Tambah Aktivitas" dan daftar aktivitas terbaru dalam satu card (bukan terpisah). Modal tambah aktivitas di sini **hanya menyediakan tipe Masuk & Keluar** (dua yang paling sering dipakai sehari-hari) — Rusak & Retur sengaja tidak ada di sini.
- **Panel Stok Menipis**: judul + daftar jadi satu (tidak dipecah jadi kartu angka + list terpisah).
- Grafik masuk-vs-keluar bulanan **sengaja tidak ada** di Dashboard (dianggap tidak perlu, cukup di Laporan) — supaya halaman ini tetap ringan dan actionable.

### Master Barang
Gabungan dari konsep "halaman Stok" dan "halaman kelola barang" — sengaja **tidak dipisah** jadi dua halaman karena cuma 1-2 orang yang pakai, tidak ada pemisahan peran (role) admin/staff.

Kolom tabel: No, Kode, Nama, Stok (real-time, highlight merah kalau ≤ stok minimum), Stok Minimum, Status, **Terakhir Diubah** (tanggal aktivitas terakhir barang itu — dihitung, bukan disimpan), Aksi (ikon).

Barang nonaktif **selalu tampil** (pudar) di bawah barang aktif — sengaja tidak ada toggle sembunyikan, supaya tidak ada barang yang "hilang" tanpa sengaja dari pandangan.

Klik satu baris → buka **panel Detail Barang** (drawer geser dari kanan, bukan modal kotak atau halaman terpisah — dipilih karena kontennya cukup padat (grafik + tabel riwayat) tapi tetap ingin terasa cepat seperti modal, bukan pindah halaman).

### Panel Detail Barang
Isi: identitas + status, kartu Stok Saat Ini & Stok Minimum, tombol Edit/Nonaktifkan/Hapus, grafik pergerakan stok 30 hari terakhir (line chart, pakai Recharts), dan tabel riwayat khusus barang tersebut.

Tombol **"Catat Aktivitas"** di sini **menyediakan semua 4 tipe** (Masuk/Keluar/Rusak/Retur) — beda dari Dashboard yang cuma 2 tipe. Alasannya: di sini barang sudah otomatis terkunci (tidak perlu pilih lagi), jadi wajar kalau semua tipe tersedia sekaligus. Ini juga jadi **tempat utama mencatat Rusak & Retur** (karena tidak ada di modal Dashboard).

### Riwayat
Daftar global semua Aktivitas. Filter: tanggal (range), tipe (dropdown), search nama barang. Kolom termasuk "Stok Setelah" (running balance). Klik ikon edit membuka modal edit langsung (tanpa konfirmasi tambahan). Bisa dihapus (dengan validasi stok tidak boleh jadi minus).

### Stock Opname
Berbeda dari Riwayat — ini alur khusus untuk mencocokkan stok sistem dengan hasil hitung fisik gudang. Kolom: Stok Sistem (read-only), Stok Fisik (input manual), Selisih (otomatis, highlight warna), Keterangan.

**Detail penting:** halaman ini pakai pagination (barangnya 200-300), tapi **isian tidak hilang saat pindah halaman** — semua tersimpan di state browser dulu, dan tombol "Simpan Opname" mengirim SEMUA baris yang terisi dari SELURUH halaman sekaligus dalam satu request. Baris yang tidak diisi dianggap "belum dicek" dan tidak berpengaruh — ini sengaja supaya staff bisa mengerjakan opname bertahap lintas hari tanpa kehilangan progress.

Barang dengan selisih otomatis membuat 1 Aktivitas bertipe **Penyesuaian** dengan `qty` bertanda (bisa negatif).

### Laporan
Bulanan, format **A4 portrait**, untuk diprint, ditujukan ke pemilik usaha ("bos"). Dua preset kolom cepat: **Stok Akhir** (No, Kode, Nama, Stok Akhir) dan **Pergerakan** (No, Kode, Nama, Masuk, Keluar, Rusak, Retur) — tapi kolom bisa dicentang & diurutkan manual lewat "Atur Kolom". Ada peringatan kalau kolom yang dipilih kemungkinan tidak muat di lebar A4.

**Status Aktif/Nonaktif tidak memfilter laporan historis** — barang yang punya histori di bulan yang dipilih tetap muncul walau sekarang sudah nonaktif. Laporan itu representasi kejadian di bulan tersebut, bukan status barang hari ini.

Pemilih periode pakai 2 dropdown custom (Bulan & Tahun, bukan `<input type="month">` bawaan browser) supaya bisa disesuaikan warna brand. Default otomatis ke bulan & tahun berjalan.

PDF digenerate di browser (client-side, pakai `@react-pdf/renderer`), bukan di server — supaya Vercel serverless function tidak terbebani sama sekali.

### Riwayat Perubahan (audit log)
Satu daftar gabungan dari `BarangAuditLog` + `AktivitasAuditLog` (bukan dipisah jadi 2 tab), dengan filter jenis perubahan. Tanpa kolom "siapa" (karena tidak ada tracking user).

## 7. Yang Belum Dikerjakan / Next Steps

- **Login/auth** (admin vs staff) — sengaja ditunda dari awal, next step besar berikutnya.
- **Struktur kategori barang** — kolom `kategori` sudah ada di database tapi disembunyikan dari semua form/UI. Belum diputuskan apakah nanti jadi dropdown tetap atau bentuk lain.
- **Import Excel massal** — untuk sekarang asumsikan input manual satu-satu lewat form "Tambah Barang".
- **Pertanyaan yang belum sempat ditanyakan ke staff gudang** dan berpotensi mengubah desain kalau jawabannya beda dari asumsi: tidak ada lagi yang mengganjal saat ini — semua pertanyaan terbuka sebelumnya (soal merek, No. JO wajib, reminder stok minimum) sudah terjawab atau sudah diputuskan cukup dengan desain yang ada (field opsional).

## 8. Catatan Status Kode

Kode di project ini ditulis lengkap mengikuti seluruh spesifikasi di atas, tapi **belum pernah dijalankan/dites terhadap database sungguhan** (dibuat di lingkungan tanpa akses ke Prisma engine/database). Kemungkinan ada error kecil (typo, ketidakcocokan tipe TypeScript ringan) yang baru ketahuan saat `npm run dev` atau `npx prisma db push` pertama kali. Ini bukan indikasi masalah desain/arsitektur — cukup jalankan dan perbaiki error yang muncul satu per satu.