
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoPronto from "../../assets/logo-prontoticketlive-large.png";

const BLUE = [0, 122, 255];
const NAVY = [17, 24, 39];
const SLATE = [71, 85, 105];
const MUTED = [100, 116, 139];
const LIGHT = [241, 245, 249];
const BORDER = [220, 228, 237];
const WHITE = [255, 255, 255];
const TEAL = [14, 165, 164];
const AMBER = [217, 119, 6];

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const money = (value, currency) =>
  `${currency} ${num(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const rateText = (value) =>
  value === null || value === undefined || value === ""
    ? "N/D"
    : `${(num(value) * 100).toFixed(2)}%`;

const unwrap = (response) => {
  let data = response?.data ?? response;
  for (let i = 0; i < 4; i += 1) {
    if (data?.summaryByCurrency) return data;
    if (!data?.data) break;
    data = data.data;
  }
  throw new Error("El servidor no devolvio un reporte fiscal valido.");
};

const entriesByCurrency = (value) => {
  if (Array.isArray(value)) return value;
  return Object.entries(value || {}).map(([currency, values]) => ({
    ...values,
    currency,
  }));
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
  const report = unwrap(response);
  const summaries = entriesByCurrency(report.summaryByCurrency);
  const summaryMap = Object.fromEntries(
    summaries.map((item) => [item.currency, item])
  );
  const taxed = Array.isArray(report.taxed) ? report.taxed : [];
  const untaxed = Array.isArray(report.untaxed) ? report.untaxed : [];
  const refunds = report.refundsByCurrency || {};
  const cancellations = report.cancellationsByCurrency || {};
  const currencies = [...new Set([
    ...summaries.map((item) => item.currency),
    ...taxed.map((item) => item.currency),
    ...untaxed.map((item) => item.currency),
    ...Object.keys(refunds),
    ...Object.keys(cancellations),
  ].filter(Boolean))].sort();

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 15;
  const RIGHT = W - M;
  const BOTTOM = H - 19;
  let y = 0;

  const header = (first = false) => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, first ? 44 : 27, "F");
    doc.setFillColor(...BLUE);
    doc.rect(0, first ? 44 : 27, W, 1.7, "F");

    // Proporcion original del logo: 1198 x 393.
    const logoW = first ? 47 : 33;
    const logoH = logoW * (393 / 1198);
    doc.addImage(logoPronto, "PNG", M, 5, logoW, logoH);

    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(first ? 14 : 11);
    doc.text(
      first
        ? "REPORTE EJECUTIVO DE SALES TAXES"
        : "SALES TAXES | REPORTE EJECUTIVO",
      first ? M : 57,
      first ? 36 : 15
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(224, 233, 245);
    doc.text(`Periodo: ${fromDate} al ${toDate}`, RIGHT, first ? 14 : 11, {
      align: "right",
    });
    doc.text("Zona horaria: America/New_York", RIGHT, first ? 22 : 17, {
      align: "right",
    });

    if (first) {
      const generated = report.generatedAt
        ? new Date(report.generatedAt)
        : new Date();

      const label = Number.isNaN(generated.getTime())
        ? "Fecha de generacion no disponible"
        : `Generado: ${generated.toLocaleString("es-US", {
            timeZone: "America/New_York",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })} (ET)`;

      doc.text(label, RIGHT, 30, { align: "right" });
    }

    y = first ? 53 : 36;
  };

  const newPage = () => {
    doc.addPage();
    header(false);
  };

  const space = (height = 15) => {
    if (y + height > BOTTOM) newPage();
  };

  const title = (text, description = "") => {
    space(description ? 20 : 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...NAVY);
    doc.text(text, M, y);
    y += 5.5;

    if (description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(description, M, y);
      y += 5;
    }
  };

  const table = (head, body, options = {}) => {
    space(19);

    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      theme: "striped",
      margin: { left: M, right: M, top: 34, bottom: 20 },
      styles: {
        font: "helvetica",
        fontSize: options.fontSize || 7.7,
        cellPadding: 2.6,
        textColor: NAVY,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: BLUE,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: options.headFontSize || 7.4,
      },
      alternateRowStyles: {
        fillColor: [245, 248, 252],
      },
      columnStyles: options.columnStyles || {},
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          header(false);
        }
      },
    });

    y = (doc.lastAutoTable?.finalY || y) + 9;
  };

  const card = (x, cy, w, label, value, accent = BLUE) => {
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(x, cy, w, 22, 2.5, 2.5, "FD");

    doc.setFillColor(...accent);
    doc.rect(x, cy + 3, 1.6, 16, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.setTextColor(...SLATE);
    doc.text(label, x + 5, cy + 7.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);

    const availableWidth = w - 10;
    const valueWidth = doc.getTextWidth(value);
    if (valueWidth > availableWidth) {
      doc.setFontSize(Math.max(7.5, 12 * availableWidth / valueWidth));
    }

    doc.text(value, x + 5, cy + 16.3);
  };

  const note = (message, warning = false) => {
    const lines = doc.splitTextToSize(message, W - M * 2 - 10);
    const height = 7 + lines.length * 4;
    space(height + 3);

    doc.setFillColor(...(warning ? [255, 248, 231] : LIGHT));
    doc.setDrawColor(...(warning ? [248, 205, 126] : BORDER));
    doc.roundedRect(M, y, W - M * 2, height, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...(warning ? [130, 80, 15] : SLATE));
    doc.text(lines, M + 5, y + 6.5);
    y += height + 5;
  };

  const eventLabel = (row) =>
    row.eventName || row.eventId || "Sin evento";

  const sortedRows = (rows) =>
    [...rows].sort(
      (a, b) =>
        String(a.currency).localeCompare(String(b.currency)) ||
        eventLabel(a).localeCompare(eventLabel(b))
    );

  const salesTable = (heading, rows) => {
    title(heading);

    if (!rows.length) {
      note("No se registraron ventas en esta categoria.");
      return;
    }

    table(
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
      sortedRows(rows).map((r) => [
        eventLabel(r),
        r.currency || "",
        rateText(r.taxRate),
        String(num(r.orders)),
        String(num(r.tickets)),
        money(r.subtotal, r.currency),
        money(r.fees, r.currency),
        money(r.taxes, r.currency),
        money(r.total, r.currency),
      ]),
      {
        columnStyles: {
          0: { cellWidth: 66 },
        },
      }
    );
  };

  const adjustmentTable = (heading, data) => {
    title(heading);

    const rows = Object.entries(data).map(([currency, item]) => [
      currency,
      money(item.total, currency),
      money(item.salesTax, currency),
    ]);

    table(
      ["Moneda", "Monto total", "Sales Tax asociado"],
      rows.length ? rows : [["Sin movimientos", "-", "-"]]
    );
  };

  const graphPanel = (heading, description, draw) => {
    const panelH = 66;
    space(panelH + 10);

    doc.setFillColor(...WHITE);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(M, y, W - M * 2, panelH, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(heading, M + 7, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(description, M + 7, y + 15);

    draw(M + 7, y + 20, W - M * 2 - 14, 40);
    y += panelH + 8;
  };

  // =====================================================
  // 1. ENCABEZADO Y PANORAMA FINANCIERO
  // =====================================================

  header(true);

  title(
    "PANORAMA FINANCIERO",
    "Importes separados por moneda; no se realizan conversiones."
  );

  if (!currencies.length) {
    note("No se registraron movimientos para el periodo seleccionado.");
  }

  for (const currency of currencies) {
    const s = summaryMap[currency] || {};
    space(39);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...BLUE);
    doc.text(`MONEDA: ${currency}`, M, y);
    y += 5;

    const gap = 3;
    const cardW = (W - 2 * M - gap * 3) / 4;

    card(
      M,
      y,
      cardW,
      "Ventas brutas",
      money(s.grossSales, currency)
    );

    card(
      M + (cardW + gap),
      y,
      cardW,
      "Ventas gravadas",
      money(s.taxableSales, currency),
      TEAL
    );

    card(
      M + 2 * (cardW + gap),
      y,
      cardW,
      "Base imponible",
      money(s.taxableBase, currency),
      SLATE
    );

    card(
      M + 3 * (cardW + gap),
      y,
      cardW,
      "Sales Tax recaudado",
      money(s.salesTax, currency),
      AMBER
    );

    y += 28;
  }

  // =====================================================
  // 2. RESUMEN GENERAL
  // =====================================================

  title("RESUMEN GENERAL POR MONEDA");

  const summaryRows = currencies.map((currency) => {
    const s = summaryMap[currency] || {};

    return [
      currency,
      money(s.grossSales, currency),
      money(s.taxableSales, currency),
      money(s.taxableBase, currency),
      money(s.nonTaxableSales, currency),
      money(s.salesTax, currency),
      money(s.refundsTotal, currency),
      money(s.refundedSalesTax, currency),
      money(s.cancellationsTotal, currency),
      money(s.netSalesAfterAdjustments, currency),
    ];
  });

  table(
    [
      "Moneda",
      "Ventas brutas",
      "Ventas gravadas",
      "Base imponible",
      "No gravadas",
      "Sales Tax",
      "Reembolsos",
      "Tax reemb.",
      "Cancelaciones",
      "Ventas netas",
    ],
    summaryRows.length
      ? summaryRows
      : [["Sin movimientos", "-", "-", "-", "-", "-", "-", "-", "-", "-"]],
    {
      fontSize: 7.1,
      headFontSize: 6.9,
    }
  );

  // =====================================================
  // 3. DETALLE DE VENTAS Y AJUSTES
  // =====================================================

  salesTable("DETALLE DE VENTAS CON SALES TAX", taxed);
  salesTable("DETALLE DE VENTAS SIN SALES TAX", untaxed);

  adjustmentTable("REEMBOLSOS DEL PERIODO", refunds);
  adjustmentTable("CANCELACIONES INTERNAS DEL PERIODO", cancellations);

  // Advertencia: tasa configurada inconsistente
  // con impuestos efectivamente registrados.
  const rateWarnings = taxed.filter(
    (r) =>
      num(r.taxes) > 0 &&
      (
        r.taxRate === null ||
        r.taxRate === undefined ||
        r.taxRate === "" ||
        num(r.taxRate) <= 0
      )
  );

  if (rateWarnings.length) {
    note(
      `REVISION FISCAL: ${rateWarnings.length} registro(s) con Sales Tax cobrado presentan tasa configurada de 0% o no disponible. Verificar la configuracion historica antes de utilizar este informe para declaraciones.`,
      true
    );
  }

  // =====================================================
  // 4. GRAFICOS EJECUTIVOS
  // =====================================================

  if (currencies.length) {
    newPage();

    title(
      "ANALISIS GRAFICO",
      "Visualizaciones descriptivas basadas en los importes registrados."
    );

    for (const currency of currencies) {
      const s = summaryMap[currency] || {};
      const taxable = Math.max(0, num(s.taxableSales));
      const nonTaxable = Math.max(0, num(s.nonTaxableSales));
      const combined = taxable + nonTaxable;

      // Grafico 1: distribucion de ventas
      graphPanel(
        `DISTRIBUCION DE VENTAS | ${currency}`,
        "Ventas gravadas frente a ventas no gravadas (importes brutos).",
        (x, gy, width) => {
          const barY = gy + 3;
          const barW = width;
          const barH = 12;

          doc.setFillColor(...LIGHT);
          doc.roundedRect(x, barY, barW, barH, 2, 2, "F");

          if (combined > 0) {
            const taxableW = (taxable / combined) * barW;
            const nonTaxableW = barW - taxableW;

            if (taxableW > 0) {
              doc.setFillColor(...BLUE);
              doc.rect(x, barY, taxableW, barH, "F");
            }

            if (nonTaxableW > 0) {
              doc.setFillColor(...TEAL);
              doc.rect(
                x + taxableW,
                barY,
                nonTaxableW,
                barH,
                "F"
              );
            }
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...SLATE);

          doc.text(
            `Gravadas: ${money(taxable, currency)} (${combined ? (100 * taxable / combined).toFixed(1) : "0.0"}%)`,
            x,
            gy + 25
          );

          doc.text(
            `No gravadas: ${money(nonTaxable, currency)} (${combined ? (100 * nonTaxable / combined).toFixed(1) : "0.0"}%)`,
            x + width / 2,
            gy + 25
          );
        }
      );

      // Grafico 2: Sales Tax por evento
      const taxByEvent = new Map();

      taxed
        .filter((r) => r.currency === currency)
        .forEach((r) => {
          const name = eventLabel(r);
          taxByEvent.set(
            name,
            (taxByEvent.get(name) || 0) + num(r.taxes)
          );
        });

      const eventTaxes = [...taxByEvent.entries()]
        .sort((a, b) => b[1] - a[1]);

      const top = eventTaxes.slice(0, 4);

      const others = eventTaxes
        .slice(4)
        .reduce((sum, [, value]) => sum + value, 0);

      if (others > 0) {
        top.push(["Otros eventos", others]);
      }

      const maxTax = Math.max(
        0,
        ...top.map(([, value]) => value)
      );

      graphPanel(
        `SALES TAX RECAUDADO POR EVENTO | ${currency}`,
        "Eventos ordenados por impuesto recaudado; otros eventos se agrupan cuando aplica.",
        (x, gy, width) => {
          if (!top.length || maxTax <= 0) {
            doc.setFontSize(9);
            doc.setTextColor(...MUTED);
            doc.text(
              "Sin Sales Tax registrado para esta moneda.",
              x,
              gy + 12
            );
            return;
          }

          const nameW = 87;
          const valueW = 38;
          const barW = width - nameW - valueW - 5;
          const rowH = 7.4;

          top.forEach(([name, value], i) => {
            const yy = gy + 2 + i * rowH;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(...SLATE);

            const shortened =
              doc.splitTextToSize(name, nameW - 4)[0] || name;

            doc.text(shortened, x, yy + 4);

            doc.setFillColor(...LIGHT);
            doc.roundedRect(
              x + nameW,
              yy,
              barW,
              4.7,
              1,
              1,
              "F"
            );

            doc.setFillColor(...BLUE);
            doc.rect(
              x + nameW,
              yy,
              (value / maxTax) * barW,
              4.7,
              "F"
            );

            doc.setTextColor(...NAVY);
            doc.text(
              money(value, currency),
              x + width,
              yy + 4,
              { align: "right" }
            );
          });
        }
      );
    }
  }

  // =====================================================
  // 5. CRITERIOS Y NOTAS
  // =====================================================

  title("CRITERIOS Y NOTAS DEL REPORTE");

  const notes = [
    "Ventas: ordenes pagadas dentro del periodo seleccionado.",
    "Clasificacion fiscal: segun el Sales Tax registrado en cada ticket.",
    "Base imponible: subtotal de tickets gravados antes de fees e impuestos.",
    "Reembolsos y cancelaciones: segun la fecha registrada de la operacion.",
    "Las cancelaciones internas se muestran separadas de los reembolsos externos.",
    "USD y EUR se presentan por separado, sin conversion de monedas.",
    "La tasa mostrada proviene de la configuracion del evento; no es una tasa efectiva calculada.",
    "Reporte administrativo sujeto a conciliacion con registros contables y fiscales.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);

  for (const line of notes) {
    space(6);
    doc.text(`- ${line}`, M, y);
    y += 5;
  }

  // =====================================================
  // 6. PIE DE PAGINA CORPORATIVO
  // =====================================================

  const totalPages = doc.internal.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(...BORDER);
    doc.line(M, H - 17, RIGHT, H - 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);

    doc.text(
      "ProntoTicketLive | Reporte administrativo de Sales Taxes",
      M,
      H - 11
    );

    doc.text(
      `Pagina ${page} de ${totalPages}`,
      RIGHT,
      H - 11,
      { align: "right" }
    );
  }

  doc.save(
    `Prontoticket_Sales_Taxes_${fromDate}_${toDate}.pdf`
  );
}
