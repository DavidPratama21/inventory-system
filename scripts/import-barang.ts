import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- helper ----------

function normalisasiHeader(h: string) {
  return h.toLowerCase().replace(/\s+/g, "");
}

function parseTanggal(raw: string): Date | null {
  const s = raw.trim();
  // coba DD/MM/YYYY
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  // coba YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return null;
}

function slugKode(nama: string): string {
  return nama
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function parseAngka(raw: string): number {
  const n = Number((raw ?? "").toString().trim().replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

// ---------- main ----------

async function main() {
  const csv = readFileSync("data/daily-report.csv", "utf-8");
  const rawRows: Record<string, string>[] = parse(csv, {
    columns: (header: string[]) => header.map(normalisasiHeader),
    skip_empty_lines: true,
    trim: true,
  });

  // Kelompokkan per nama barang
  const grup = new Map<string, { tanggal: Date; masuk: number; keluar: number; sisaStok: number; rawTanggal: string }[]>();

  for (const row of rawRows) {
    const nama = row["barang"]?.trim();
    const tanggalStr = row["tanggal"];
    if (!nama || !tanggalStr) continue;

    const tanggal = parseTanggal(tanggalStr);
    if (!tanggal) {
      console.warn(`⚠️  Lewati baris: tanggal "${tanggalStr}" gak kebaca formatnya (barang: ${nama})`);
      continue;
    }

    const masuk = parseAngka(row["masuk"]);
    const keluar = parseAngka(row["keluar"]);
    const sisaStok = parseAngka(row["sisastok"]);

    const list = grup.get(nama) ?? [];
    list.push({ tanggal, masuk, keluar, sisaStok, rawTanggal: tanggalStr });
    grup.set(nama, list);
  }

  const kodeTerpakai = new Set(
    (await prisma.barang.findMany({ select: { kode: true } })).map((b) => b.kode)
  );

  let barangBaru = 0;
  let aktivitasDibuat = 0;

  for (const [nama, rows] of grup) {
    // Urutkan kronologis
    rows.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());

    // Cari atau buat barang (case-insensitive)
    let barang = await prisma.barang.findFirst({
      where: { nama: { equals: nama, mode: "insensitive" } },
    });

    if (!barang) {
      let kode = slugKode(nama) || "BARANG";
      let suffix = 1;
      let kodeFinal = kode;
      while (kodeTerpakai.has(kodeFinal)) {
        suffix++;
        kodeFinal = `${kode}-${suffix}`;
      }
      kodeTerpakai.add(kodeFinal);

      barang = await prisma.barang.create({ data: { kode: kodeFinal, nama } });
      barangBaru++;
      console.log(`+ Barang baru: ${kodeFinal} — ${nama}`);
    }

    for (const r of rows) {
      if (r.masuk > 0) {
        await prisma.aktivitas.create({
          data: {
            barangId: barang.id,
            tipe: "MASUK",
            qty: r.masuk,
            keterangan: "Impor dari Daily_Report",
            tanggalKejadian: r.tanggal,
          },
        });
        aktivitasDibuat++;
      }
      if (r.keluar > 0) {
        await prisma.aktivitas.create({
          data: {
            barangId: barang.id,
            tipe: "KELUAR",
            qty: r.keluar,
            keterangan: "Impor dari Daily_Report",
            tanggalKejadian: r.tanggal,
          },
        });
        aktivitasDibuat++;
      }
    }
  }

  console.log("\n=== Selesai ===");
  console.log(`Barang baru dibuat : ${barangBaru}`);
  console.log(`Aktivitas dibuat   : ${aktivitasDibuat}`);
}

main().finally(() => prisma.$disconnect());