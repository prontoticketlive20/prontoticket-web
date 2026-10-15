
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

  const currencies = [
    ...new Set(
      [
        ...summaries.map((item) => item.currency),
        ...taxed.map((item) => item.currency),
        ...untaxed.map((item) => item.currency),
        ...Object.keys(refunds),
        ...Object.keys(cancellations),
      ].filter(Boolean)
    ),
  ].sort();

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 15;
  const RIGHT = W - M;
  const BOTTOM = H - 19;

  let y = 0;

  // =====================================================
  // 1. ENCABEZADOS Y PAGINACION
  // =====================================================

  const drawHeader = (first = false) => {
    const headerHeight = first ? 44 : 27;

    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, headerHeight, "F");

    doc.setFillColor(...BLUE);
    doc.rect(0, headerHeight, W, 1.7, "F");

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

    doc.text(
      `Periodo: ${fromDate} al ${toDate}`,
      RIGHT,
      first ? 14 : 11,
      { align: "right" }
    );

    doc.text(
      "Zona horaria: America/New_York",
      RIGHT,
      first ? 22 : 17,
      { align: "right" }
    );

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
  };

  const newPage = () => {
    doc.addPage();
    drawHeader(false);
    y = 36;
  };

  const space = (height = 15) => {
    if (y + height > BOTTOM) {
      newPage();
    }
  };

  // =====================================================
  // 2. COMPONENTES VISUALES
  // =====================================================

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

    const startPage = doc.internal.getCurrentPageInfo().pageNumber;

    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      theme: "striped",
      margin: {
        left: M,
        right: M,
        top: 34,
        bottom: 20,
      },
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
        // Encabezado en paginas nuevas generadas por AutoTable.
        if (data.pageNumber > 1) {
          const currentPage =
            doc.internal.getCurrentPageInfo().pageNumber;

          if (currentPage > startPage) {
            drawHeader(false);
          }
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
      doc.setFontSize(
        Math.max(7.5, (12 * availableWidth) / valueWidth)
      );
    }

    doc.text(value, x + 5, cy + 16.3);
  };

  const note = (message, warning = false) => {
    const lines = doc.splitTextToSize(
      message,
      W - M * 2 - 10
    );

    const height = 7 + lines.length * 4;

    space(height + 3);

    doc.setFillColor(
      ...(warning ? [255, 248, 231] : LIGHT)
    );

    doc.setDrawColor(
      ...(warning ? [248, 205, 126] : BORDER)
    );

    doc.roundedRect(
      M,
      y,
      W - M * 2,
      height,
      2,
      2,
      "FD"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.setTextColor(
      ...(warning ? [130, 80, 15] : SLATE)
    );

    doc.text(lines, M + 5, y + 6.5);

    y += height + 5;
  };

  // =====================================================
  // 3. TABLAS FINANCIERAS
  // =====================================================

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

    const rows = Object.entries(data || {}).map(
      ([currency, item]) => [
        currency,
        money(item.total, currency),
        money(item.salesTax, currency),
      ]
    );

    table(
      ["Moneda", "Monto total", "Sales Tax asociado"],
      rows.length
        ? rows
        : [["Sin movimientos", "-", "-"]]
    );
  };

  // =====================================================
  // 4. GRAFICOS VECTORIALES
  // =====================================================

  const chartColors = [
    BLUE,
    TEAL,
    AMBER,
    [139, 92, 246],
    [236, 72, 153],
  ];

  const percentText = (value, total) =>
    total > 0
      ? `${((value / total) * 100).toFixed(1)}%`
      : "0.0%";

  const drawLegendItem = (
    x,
    ly,
    color,
    label,
    value,
    currency,
    width
  ) => {
    doc.setFillColor(...color);
    doc.roundedRect(x, ly - 3, 3.5, 3.5, 0.7, 0.7, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.setTextColor(...SLATE);

    const maxLabelWidth = Math.max(20, width - 6);
    const labelLine =
      doc.splitTextToSize(label, maxLabelWidth)[0] || label;

    doc.text(labelLine, x + 6, ly);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...NAVY);

    doc.text(
      money(value, currency),
      x + 6,
      ly + 4.7
    );
  };

  const drawDonut = (
    cx,
    cy,
    outerRadius,
    innerRadius,
    slices
  ) => {
    const positiveSlices = slices.filter(
      (item) => num(item.value) > 0
    );

    const total = positiveSlices.reduce(
      (sum, item) => sum + num(item.value),
      0
    );

    if (total <= 0) {
      doc.setFillColor(...LIGHT);
      doc.circle(cx, cy, outerRadius, "F");

      doc.setFillColor(...WHITE);
      doc.circle(cx, cy, innerRadius, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);

      doc.text("Sin datos", cx, cy + 1, {
        align: "center",
      });

      return;
    }

    // Segmentos vectoriales para conservar nitidez al imprimir.
    let startAngle = -Math.PI / 2;

    positiveSlices.forEach((slice) => {
      const angle =
        (num(slice.value) / total) * Math.PI * 2;

      const endAngle = startAngle + angle;

      doc.setFillColor(...slice.color);

      const steps = Math.max(
        12,
        Math.ceil((angle / (Math.PI * 2)) * 100)
      );

      const points = [];

      for (let i = 0; i <= steps; i += 1) {
        const theta =
          startAngle + (angle * i) / steps;

        points.push([
          cx + outerRadius * Math.cos(theta),
          cy + outerRadius * Math.sin(theta),
        ]);
      }

      // Dibujar cada sector como triangulos.
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i];
        const b = points[i + 1];

        doc.triangle(
          cx,
          cy,
          a[0],
          a[1],
          b[0],
          b[1],
          "F"
        );
      }

      startAngle = endAngle;
    });

    doc.setFillColor(...WHITE);
    doc.circle(cx, cy, innerRadius, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);

    doc.text("100%", cx, cy + 1.2, {
      align: "center",
    });
  };

  const chartCard = (x, cy, width, height, heading, description) => {
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...BORDER);

    doc.roundedRect(
      x,
      cy,
      width,
      height,
      3,
      3,
      "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...NAVY);

    doc.text(heading, x + 6, cy + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);

    const descriptionLines = doc.splitTextToSize(
      description,
      width - 12
    );

    doc.text(
      descriptionLines.slice(0, 2),
      x + 6,
      cy + 15
    );
  };

  const drawSalesDistribution = (
    x,
    cy,
    width,
    height,
    currency,
    summary
  ) => {
    chartCard(
      x,
      cy,
      width,
      height,
      `DISTRIBUCION DE VENTAS | ${currency}`,
      "Ventas gravadas y no gravadas, sobre importes brutos."
    );

    const taxable = Math.max(
      0,
      num(summary.taxableSales)
    );

    const nonTaxable = Math.max(
      0,
      num(summary.nonTaxableSales)
    );

    const total = taxable + nonTaxable;

    const cx = x + 35;
    const centerY = cy + 43;

    drawDonut(
      cx,
      centerY,
      20,
      11.5,
      [
        {
          value: taxable,
          color: BLUE,
        },
        {
          value: nonTaxable,
          color: TEAL,
        },
      ]
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);

    doc.text(
      total > 0 ? "VENTAS" : "SIN VENTAS",
      cx,
      centerY - 1,
      { align: "center" }
    );

    if (total > 0) {
      doc.setFontSize(7);
      doc.text(
        "100%",
        cx,
        centerY + 4,
        { align: "center" }
      );
    }

    const legendX = x + 66;
    const legendW = width - 73;

    drawLegendItem(
      legendX,
      cy + 33,
      BLUE,
      `Gravadas (${percentText(taxable, total)})`,
      taxable,
      currency,
      legendW
    );

    drawLegendItem(
      legendX,
      cy + 52,
      TEAL,
      `No gravadas (${percentText(nonTaxable, total)})`,
      nonTaxable,
      currency,
      legendW
    );
  };

  const drawEventTaxBars = (
    x,
    cy,
    width,
    height,
    currency,
    rows
  ) => {
    chartCard(
      x,
      cy,
      width,
      height,
      `SALES TAX POR EVENTO | ${currency}`,
      "Principales eventos por impuesto recaudado."
    );

    const taxByEvent = new Map();

    rows
      .filter((row) => row.currency === currency)
      .forEach((row) => {
        const key = row.eventId || eventLabel(row);

        const current = taxByEvent.get(key);

        if (current) {
          current.value += num(row.taxes);
        } else {
          taxByEvent.set(key, {
            name: eventLabel(row),
            value: num(row.taxes),
          });
        }
      });

    const eventTaxes = [...taxByEvent.values()]
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const top = eventTaxes.slice(0, 4);

    const otherTotal = eventTaxes
      .slice(4)
      .reduce(
        (sum, item) => sum + item.value,
        0
      );

    if (otherTotal > 0) {
      top.push({
        name: "Otros eventos",
        value: otherTotal,
      });
    }

    if (!top.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);

      doc.text(
        "Sin Sales Tax registrado para esta moneda.",
        x + 7,
        cy + 39
      );

      return;
    }

    const maxTax = Math.max(
      ...top.map((item) => item.value)
    );

    const labelW = 42;
    const valueW = 32;
    const chartW = width - labelW - valueW - 20;

    const rowHeight = 9;
    const startY = cy + 24;

    top.forEach((item, index) => {
      const rowY = startY + index * rowHeight;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...SLATE);

      const shortened =
        doc.splitTextToSize(
          item.name,
          labelW - 3
        )[0] || item.name;

      doc.text(
        shortened,
        x + 6,
        rowY + 3.8
      );

      const barX = x + 6 + labelW;

      doc.setFillColor(...LIGHT);
      doc.roundedRect(
        barX,
        rowY,
        chartW,
        4.7,
        1,
        1,
        "F"
      );

      doc.setFillColor(
        ...chartColors[index % chartColors.length]
      );

      doc.rect(
        barX,
        rowY,
        maxTax > 0
          ? (item.value / maxTax) * chartW
          : 0,
        4.7,
        "F"
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.9);
      doc.setTextColor(...NAVY);

      doc.text(
        money(item.value, currency),
        x + width - 6,
        rowY + 3.8,
        { align: "right" }
      );
    });
  };

  const drawExecutiveCharts = (currency, summary) => {
    const chartHeight = 77;

    space(chartHeight + 17);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);

    doc.text(
      `ANALISIS GRAFICO | ${currency}`,
      M,
      y
    );

    y += 7;

    const gap = 5;
    const chartWidth =
      (W - M * 2 - gap) / 2;

    drawSalesDistribution(
      M,
      y,
      chartWidth,
      chartHeight,
      currency,
      summary
    );

    drawEventTaxBars(
      M + chartWidth + gap,
      y,
      chartWidth,
      chartHeight,
      currency,
      taxed
    );

    y += chartHeight + 11;
  };

  // =====================================================
  // 5. ENCABEZADO PRINCIPAL
  // =====================================================

  drawHeader(true);
  y = 53;

  title(
    "PANORAMA FINANCIERO",
    "Importes separados por moneda; no se realizan conversiones."
  );

  if (!currencies.length) {
    note(
      "No se registraron movimientos para el periodo seleccionado."
    );
  }

  for (const currency of currencies) {
    const s = summaryMap[currency] || {};

    space(39);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...BLUE);

    doc.text(
      `MONEDA: ${currency}`,
      M,
      y
    );

    y += 5;

    const gap = 3;
    const cardW =
      (W - 2 * M - gap * 3) / 4;

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
  // 6. RESUMEN GENERAL POR MONEDA
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
      : [
          [
            "Sin movimientos",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
          ],
        ],
    {
      fontSize: 7.1,
      headFontSize: 6.9,
    }
  );

  // =====================================================
  // 7. DETALLE DE VENTAS Y AJUSTES
  // =====================================================

  salesTable(
    "DETALLE DE VENTAS CON SALES TAX",
    taxed
  );

  salesTable(
    "DETALLE DE VENTAS SIN SALES TAX",
    untaxed
  );

  adjustmentTable(
    "REEMBOLSOS DEL PERIODO",
    refunds
  );

  adjustmentTable(
    "CANCELACIONES INTERNAS DEL PERIODO",
    cancellations
  );

  // Verificar discrepancias entre la tasa actualmente
  // configurada y el impuesto registrado en tickets.
  const rateWarnings = taxed.filter(
    (row) =>
      num(row.taxes) > 0 &&
      (
        row.taxRate === null ||
        row.taxRate === undefined ||
        row.taxRate === "" ||
        num(row.taxRate) <= 0
      )
  );

  if (rateWarnings.length) {
    note(
      `REVISION FISCAL: ${rateWarnings.length} registro(s) con Sales Tax cobrado presentan tasa configurada de 0% o no disponible. Verificar la configuracion historica antes de utilizar este informe para declaraciones.`,
      true
    );
  }

  // =====================================================
  // 8. DASHBOARD GRAFICO EJECUTIVO
  // =====================================================

  if (currencies.length) {
    newPage();

    title(
      "DASHBOARD EJECUTIVO",
      "Distribucion de ventas y recaudacion fiscal por evento."
    );

    for (const currency of currencies) {
      drawExecutiveCharts(
        currency,
        summaryMap[currency] || {}
      );
    }
  }

  // =====================================================
  // 9. CRITERIOS Y NOTAS
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

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);

    doc.text(`- ${line}`, M, y);
    y += 5;
  }

  // =====================================================
  // 10. PIE DE PAGINA CORPORATIVO
  // =====================================================

  const totalPages =
    doc.internal.getNumberOfPages();

  for (
    let page = 1;
    page <= totalPages;
    page += 1
  ) {
    doc.setPage(page);

    doc.setDrawColor(...BORDER);
    doc.line(
      M,
      H - 17,
      RIGHT,
      H - 17
    );

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
