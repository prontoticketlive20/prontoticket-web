
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const BLUE = [0, 122, 255];
const DARK = [17, 24, 39];
const GRAY = [100, 116, 139];

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value, currency) => {
  const amount = number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${amount}`;
};

const formatRate = (value) => {
  if (value === null || value === undefined || value === "") {
    return "N/D";
  }

  const rate = number(value) * 100;
  return `${rate.toFixed(2)}%`;
};

const unwrapResponse = (response) => {
  let data = response?.data ?? response;

  for (let i = 0; i < 3; i += 1) {
    if (data?.summaryByCurrency) return data;
    if (!data?.data) break;
    data = data.data;
  }

  throw new Error("El servidor no devolvio un reporte fiscal valido.");
};

export async function exportSalesTaxPdf(api, fromDate, toDate) {
  if (!fromDate || !toDate) {
    throw new Error("Selecciona las fechas Desde y Hasta.");
  }

  if (fromDate > toDate) {
    throw new Error("La fecha Desde no puede ser posterior a Hasta.");
  }

  const response = await api.get("/admin/reports/sales-tax", {
    params: { from: fromDate, to: toDate },
  });

  const report = unwrapResponse(response);

  const summaries = Array.isArray(report.summaryByCurrency)
  ? report.summaryByCurrency
  : Object.entries(report.summaryByCurrency || {}).map(
      ([currency, values]) => ({ ...values, currency })
    );

const summaryMap = Object.fromEntries(
  summaries.map((item) => [item.currency, item])
);

const currencies = [
  ...new Set([
    ...summaries.map((item) => item.currency),
    ...(report.taxed || []).map((row) => row.currency),
    ...(report.untaxed || []).map((row) => row.currency),
    ...Object.keys(report.refundsByCurrency || {}),
    ...Object.keys(report.cancellationsByCurrency || {}),
  ].filter(Boolean)),
].sort();

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  const ensureSpace = (height = 22) => {
    if (y + height > 185) {
      doc.addPage();
      y = 22;
    }
  };

  const sectionTitle = (title) => {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text(title, margin, y);
    y += 6;
  };

  const drawTable = (head, body, widths = {}) => {
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      theme: "striped",
      margin: { left: margin, right: margin, top: 18, bottom: 18 },
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        textColor: DARK,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: BLUE,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [243, 247, 252],
      },
      columnStyles: widths,
    });

    y = (doc.lastAutoTable?.finalY || y) + 11;
  };

  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 40, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("PRONTOTICKETLIVE", margin, 17);

  doc.setFontSize(13);
  doc.text("REPORTE DE SALES TAXES", margin, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Periodo: ${fromDate} al ${toDate}`, pageWidth - margin, 18, {
    align: "right",
  });
  doc.text("Zona horaria: America/New_York", pageWidth - margin, 26, {
    align: "right",
  });

  y = 52;

  sectionTitle("RESUMEN GENERAL POR MONEDA");

  const summaryRows = currencies.map((currency) => {
    const s = summaryMap[currency] || {};

    return [
      currency,
      formatMoney(s.grossSales, currency),
      formatMoney(s.taxableSales, currency),
      formatMoney(s.taxableBase, currency),
      formatMoney(s.nonTaxableSales, currency),
      formatMoney(s.salesTax, currency),
      formatMoney(s.refundsTotal, currency),
      formatMoney(s.refundedSalesTax, currency),
      formatMoney(s.cancellationsTotal, currency),
      formatMoney(s.netSalesAfterAdjustments, currency),
    ];
  });

  drawTable(
    [
      "Moneda",
      "Ventas brutas",
      "Ventas gravadas",
      "Base imponible",
      "Ventas no gravadas",
      "Sales Tax",
      "Reembolsos",
      "Tax reembolsado",
      "Cancelaciones",
      "Ventas netas",
    ],
    summaryRows.length ? summaryRows : [["Sin movimientos en el periodo"]],
  );

  const renderSalesSection = (title, rows) => {
    sectionTitle(title);

    if (!rows?.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text("No se registraron ventas en esta categoria.", margin, y);
      y += 12;
      return;
    }

    const sorted = [...rows].sort((a, b) => {
      return (
        String(a.currency).localeCompare(String(b.currency)) ||
        String(a.eventName).localeCompare(String(b.eventName))
      );
    });

    drawTable(
      [
        "Evento",
        "Moneda",
        "Tasa",
        "Ordenes",
        "Tickets",
        "Subtotal",
        "Fees",
        "Sales Tax",
        "Total",
      ],
      sorted.map((row) => [
        row.eventName || row.eventId || "Sin evento",
        row.currency || "",
        formatRate(row.taxRate),
        String(number(row.orders)),
        String(number(row.tickets)),
        formatMoney(row.subtotal, row.currency),
        formatMoney(row.fees, row.currency),
        formatMoney(row.taxes, row.currency),
        formatMoney(row.total, row.currency),
      ]),
      { 0: { cellWidth: 68 } }
    );
  };

  renderSalesSection("VENTAS CON SALES TAX", report.taxed);
  renderSalesSection("VENTAS SIN SALES TAX", report.untaxed);

  const renderAdjustments = (title, data) => {
    sectionTitle(title);

    const rows = Object.entries(data || {}).map(([currency, item]) => [
      currency,
      formatMoney(item.total, currency),
      formatMoney(item.salesTax, currency),
    ]);

    drawTable(
      ["Moneda", "Monto total", "Sales Tax asociado"],
      rows.length ? rows : [["Sin movimientos", "-", "-"]]
    );
  };

  renderAdjustments("REEMBOLSOS DEL PERIODO", report.refundsByCurrency);
  renderAdjustments("CANCELACIONES INTERNAS DEL PERIODO", report.cancellationsByCurrency);

  sectionTitle("CRITERIOS DEL REPORTE");

  const notes = [
    "Ventas: ordenes pagadas dentro del periodo seleccionado.",
    "Clasificacion fiscal: segun el Sales Tax registrado en cada ticket.",
    "Reembolsos y cancelaciones: segun la fecha registrada de la operacion.",
    "USD y EUR se presentan por separado, sin conversion de monedas.",
    "El reporte es operativo y debe conciliarse con los registros contables.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);

  notes.forEach((note) => {
    ensureSpace(7);
    doc.text(note, margin, y);
    y += 5;
  });

  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(220, 226, 235);
    doc.line(margin, 192, pageWidth - margin, 192);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("Prontoticketlive | Reporte administrativo de Sales Taxes", margin, 199);
    doc.text(`Pagina ${page} de ${pageCount}`, pageWidth - margin, 199, {
      align: "right",
    });
  }

  doc.save(`Prontoticket_Sales_Taxes_${fromDate}_${toDate}.pdf`);
}
