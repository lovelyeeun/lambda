"use client";

import type { Product } from "@/lib/types";

export interface CartExportItem {
  product: Product;
  quantity: number;
}

/* ─── 날짜 포맷 ─── */
function fmtDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateTime() {
  const d = new Date();
  return `${fmtDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════
   Excel Export
   ═══════════════════════════════════════ */
export async function exportCartToExcel(items: CartExportItem[]) {
  const XLSX = await import("xlsx");

  const rows = items.map((item, i) => ({
    "No.": i + 1,
    "상품명": item.product.name,
    "브랜드": item.product.brand,
    "카테고리": item.product.category,
    "소싱처": item.product.source ?? "-",
    "단가(원)": item.product.price,
    "수량": item.quantity,
    "합계(원)": item.product.price * item.quantity,
    "재고": item.product.inStock ? "있음" : "품절",
    "배송태그": item.product.tags?.join(", ") ?? "-",
  }));

  const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rows as any[]).push({
    "No.": "",
    "상품명": "합계",
    "브랜드": "",
    "카테고리": "",
    "소싱처": "",
    "단가(원)": "",
    "수량": totalQty,
    "합계(원)": totalPrice,
    "재고": "",
    "배송태그": "",
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  /* 열 너비 */
  ws["!cols"] = [
    { wch: 5 },   // No.
    { wch: 35 },  // 상품명
    { wch: 12 },  // 브랜드
    { wch: 10 },  // 카테고리
    { wch: 12 },  // 소싱처
    { wch: 12 },  // 단가
    { wch: 6 },   // 수량
    { wch: 14 },  // 합계
    { wch: 6 },   // 재고
    { wch: 16 },  // 배송태그
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "장바구니");

  const fileName = `장바구니_${fmtDate()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/* ═══════════════════════════════════════
   PDF Export
   ═══════════════════════════════════════ */
export async function exportCartToPDF(items: CartExportItem[]) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  /* 한글 미지원이므로 영문/숫자 기반 + 유니코드 대체 */
  /* 제목 */
  doc.setFontSize(16);
  doc.text("Cart Summary", 14, 18);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exported: ${fmtDateTime()}  |  Items: ${items.length}`, 14, 25);
  doc.setTextColor(0);

  const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  const tableData = items.map((item, i) => [
    String(i + 1),
    item.product.name,
    item.product.brand,
    item.product.category,
    item.product.source ?? "-",
    item.product.price.toLocaleString("ko-KR"),
    String(item.quantity),
    (item.product.price * item.quantity).toLocaleString("ko-KR"),
    item.product.inStock ? "O" : "X",
  ]);

  /* 합계 행 */
  tableData.push([
    "",
    "TOTAL",
    "",
    "",
    "",
    "",
    String(totalQty),
    totalPrice.toLocaleString("ko-KR"),
    "",
  ]);

  autoTable(doc, {
    startY: 30,
    head: [["No.", "Product", "Brand", "Category", "Source", "Unit Price", "Qty", "Total", "Stock"]],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      5: { halign: "right" },
      6: { halign: "center", cellWidth: 12 },
      7: { halign: "right" },
      8: { halign: "center", cellWidth: 12 },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [245, 245, 245];
      }
    },
  });

  const fileName = `Cart_${fmtDate()}.pdf`;
  doc.save(fileName);
}
