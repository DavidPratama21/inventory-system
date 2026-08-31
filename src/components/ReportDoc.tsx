import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { SEMUA_KOLOM, ambilNilaiKolom, type KolomKey } from "@/lib/laporanColumns";

const NAVY = "#0A2643";
const AMBER = "#FCA311";

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: NAVY },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: AMBER,
    paddingBottom: 8,
    marginBottom: 12,
  },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  brandSub: { fontSize: 8, color: "#64748B", marginTop: 2 },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", textAlign: "right" },
  periode: { fontSize: 9, textAlign: "right", marginTop: 2 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#CBD5E1" },
  headRow: { flexDirection: "row", backgroundColor: NAVY, color: "#FFFFFF" },
  cell: { paddingVertical: 4, paddingHorizontal: 3 },
  bold: { fontFamily: "Helvetica-Bold" },
  right: { textAlign: "right" },
  signRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 28 },
  signBox: { width: 140, alignItems: "center", marginLeft: 24 },
  signLine: { borderBottomWidth: 0.7, borderBottomColor: NAVY, width: "100%", marginTop: 44 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#64748B",
  },
});

export function ReportDoc({
  periode,
  rows,
  kolom,
  generatedAt,
}: {
  periode: string;
  rows: any[];
  kolom: KolomKey[];
  generatedAt: string;
}) {
  const width = `${100 / kolom.length}%`;
  return (
    <Document title={`Laporan Stok ${periode}`}>
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <View>
            <Text style={s.brand}>
              SHIBA <Text style={{ color: AMBER }}>GUDANG</Text>
            </Text>
            <Text style={s.brandSub}>PT Shiba Hidrolik Pratama · Sistem Inventory</Text>
          </View>
          <View>
            <Text style={s.title}>LAPORAN STOK BULANAN</Text>
            <Text style={s.periode}>Periode: {periode}</Text>
          </View>
        </View>

        <View style={s.headRow} fixed>
          {kolom.map((k) => {
            const label = SEMUA_KOLOM.find((c) => c.key === k)?.label ?? k;
            const isNum = k !== "no" && k !== "kode" && k !== "nama";
            return (
              <Text key={k} style={[s.cell, s.bold, isNum ? s.right : {}, { width }]}>
                {label}
              </Text>
            );
          })}
        </View>

        {rows.map((r, i) => (
          <View key={r.kode} style={[s.row, i % 2 === 1 ? { backgroundColor: "#F2F4F7" } : {}]} wrap={false}>
            {kolom.map((k) => {
              const isNum = k !== "no" && k !== "kode" && k !== "nama";
              return (
                <Text key={k} style={[s.cell, isNum ? s.right : {}, { width }]}>
                  {String(ambilNilaiKolom(r, k, i + 1))}
                </Text>
              );
            })}
          </View>
        ))}

        <View style={s.signRow} wrap={false}>
          <View style={s.signBox}>
            <Text>Dibuat oleh,</Text>
            <View style={s.signLine} />
            <Text style={{ marginTop: 3 }}>Staff Gudang</Text>
          </View>
          <View style={s.signBox}>
            <Text>Mengetahui,</Text>
            <View style={s.signLine} />
            <Text style={{ marginTop: 3 }}>Kepala Gudang</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>Dicetak dari Shiba Gudang · {generatedAt}</Text>
          <Text render={({ pageNumber, totalPages }) => `Hal. ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
