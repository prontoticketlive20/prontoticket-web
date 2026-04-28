import React, { useEffect, useRef, useState } from 'react';
import api from '../api/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoPronto from '../assets/logo-prontoticketlive.png';

export default function CampaignDashboard() {
  const pdfReportRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [analytics, setAnalytics] = useState({
    totalSent: 0,
    totalClicks: 0,
    totalOpens: 0,
    purchases: 0,
    revenue: 0,
    ctr: 0,
    openRate: 0,
    conversionRate: 0,
    topEvents: [],
  });

  useEffect(() => {
  fetchData();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));

const number = (value) =>
  new Intl.NumberFormat('en-US').format(Number(value || 0));

  const normalizeAnalyticsResponse = (res) => {
    return (
      res.data?.data?.data ||
      res.data?.data ||
      res.data ||
      {}
    );
  };

  const buildAnalytics = (analyticsData, fallbackSent = 0) => {
    const totalSent = analyticsData.totalSent || fallbackSent || 0;
    const totalClicks = analyticsData.totalClicks || 0;
    const totalOpens = analyticsData.totalOpens || 0;
    const purchases = analyticsData.purchases || 0;
    const revenue = analyticsData.revenue || 0;

    return {
      totalSent,
      totalClicks,
      totalOpens,
      purchases,
      revenue,
      ctr:
        analyticsData.ctr ??
        (totalSent > 0
          ? Number(((totalClicks / totalSent) * 100).toFixed(2))
          : 0),
      openRate:
        analyticsData.openRate ??
        (totalSent > 0
          ? Number(((totalOpens / totalSent) * 100).toFixed(2))
          : 0),
      conversionRate:
        analyticsData.conversionRate ??
        (totalClicks > 0
          ? Number(((purchases / totalClicks) * 100).toFixed(2))
          : 0),
      topEvents: analyticsData.topEvents || [],
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setSelectedCampaign(null);

      const statsRes = await api.get('/mail/campaign-stats');
      const analyticsRes = await api.get('/mail/analytics');

      const statsData = statsRes.data?.data || statsRes.data || {};
      const analyticsData = normalizeAnalyticsResponse(analyticsRes);

      setCampaigns(statsData.campaigns || []);

      setAnalytics(
        buildAnalytics(
          analyticsData,
          statsData.totalEmailsSent || 0,
        ),
      );
    } catch (err) {
      console.error('Error cargando analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampaign = async (campaign) => {
    try {
      setCampaignLoading(true);
      setSelectedCampaign(campaign);

      const res = await api.get(`/mail/analytics/${campaign.id}`);
      const analyticsData = normalizeAnalyticsResponse(res);

      setAnalytics(
        buildAnalytics(
          analyticsData,
          campaign.totalSent || 0,
        ),
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      console.error('Error campaña específica:', err);
    } finally {
      setCampaignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-white p-10 text-center bg-black min-h-screen">
        Cargando campañas...
      </div>
    );
  }

  const isSpecificView = !!selectedCampaign;

  const totalCampaigns = isSpecificView ? 1 : campaigns.length;
  const totalEmails = analytics.totalSent;
  const totalOpens = analytics.totalOpens;
  const totalClicks = analytics.totalClicks;
  const purchases = analytics.purchases;
  const revenue = analytics.revenue;
  const ctr = analytics.ctr;
  const openRate = analytics.openRate;
  const conversionRate = analytics.conversionRate;

  const avgEmails =
    !isSpecificView && campaigns.length > 0
      ? Math.round(totalEmails / campaigns.length)
      : totalEmails;

  const bestCampaign = campaigns.reduce((best, current) => {
    if (!best) return current;
    return (current.totalSent || 0) > (best.totalSent || 0)
      ? current
      : best;
  }, null);

  const chartData = isSpecificView
    ? [
        {
          date: selectedCampaign?.createdAt
            ? new Date(
                selectedCampaign.createdAt,
              ).toLocaleDateString()
            : 'Campaña',
          emails: totalEmails,
          opens: totalOpens,
          clicks: totalClicks,
          purchases,
        },
      ]
    : campaigns.map((c) => ({
        date: new Date(c.createdAt).toLocaleDateString(),
        emails: c.totalSent || 0,
        opens: c.totalOpens || 0,
        clicks: c.totalClicks || 0,
        purchases: c.totalPurchases || 0,
      }));

  const funnelData = [
    { name: 'Enviados', value: totalEmails },
    { name: 'Aperturas', value: totalOpens },
    { name: 'Clicks', value: totalClicks },
    { name: 'Compras', value: purchases },
  ];

  const topEvent = analytics.topEvents?.[0];

  const exportToPDF = async () => {
  try {
    const input = pdfReportRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#050505',
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.setFillColor(5, 5, 5);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    const fileName = isSpecificView
      ? `ProntoTicketLive_Campaign_Report_${selectedCampaign?.name || 'Campaign'}.pdf`
      : 'ProntoTicketLive_Campaign_Global_Report.pdf';

    pdf.save(fileName);
  } catch (error) {
    console.error('Error exportando PDF campaña:', error);
    alert('No se pudo exportar el PDF');
  }
};

  return (
    <div className="p-6 text-white bg-black min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            📧 Dashboard de Campañas
          </h1>

          <p className="text-gray-400 mt-1">
            {isSpecificView
              ? `Vista específica: ${
                  selectedCampaign?.name ||
                  'Campaña seleccionada'
                }`
              : 'Vista global de campañas y conversiones.'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">

         <button
         onClick={exportToPDF}
         className="bg-gradient-to-r from-[#007AFF] to-[#0056b3] hover:brightness-110 px-5 py-2 rounded-xl font-semibold transition shadow-lg shadow-blue-500/20"
         type="button"
          >
         📄 Exportar PDF
        </button> 

          {isSpecificView && (
            <button
              onClick={fetchData}
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-2 rounded-xl font-semibold transition border border-zinc-700"
            >
              Ver Global
            </button>
          )}

          <button
            onClick={() =>
              (window.location.href =
                '/admin/campaigns/create')
            }
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold transition"
          >
            + Crear Campaña
          </button>
        </div>
      </div>

      {/* ALERTA */}
      {isSpecificView && (
        <div className="bg-blue-950/40 border border-blue-800 text-blue-200 rounded-2xl p-4 mb-6">
          Analizando solo esta campaña:{' '}
          <strong>{selectedCampaign?.name}</strong>
        </div>
      )}

      {/* CARDS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">

        <CardSmall
          title={
            isSpecificView ? 'Campaña' : 'Campañas'
          }
          value={totalCampaigns}
        />

        <CardSmall
          title="Emails"
          value={totalEmails.toLocaleString()}
          color="text-green-400"
        />

        <CardSmall
          title="Aperturas"
          value={totalOpens.toLocaleString()}
          color="text-blue-400"
        />

        <CardSmall
          title="Clicks"
          value={totalClicks.toLocaleString()}
          color="text-yellow-400"
        />

        <CardSmall
          title="CTR"
          value={`${ctr}%`}
          color="text-purple-400"
        />

        <CardSmall
          title="Compras"
          value={purchases}
          color="text-emerald-400"
        />

        <CardSmall
          title="Revenue"
          value={`$${Number(revenue).toFixed(2)}`}
          color="text-orange-400"
        />

        <CardSmall
          title="Conv."
          value={`${conversionRate}%`}
          color="text-pink-400"
        />

      </div>

      {/* KPIs EXTRA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        <CardBig
          title="Open Rate"
          value={`${openRate}%`}
          color="text-blue-400"
        />

        <CardBig
          title={
            isSpecificView
              ? 'Emails de esta campaña'
              : 'Promedio por campaña'
          }
          value={avgEmails.toLocaleString()}
        />

        <CardBig
          title={
            isSpecificView
              ? 'Revenue campaña'
              : 'Mejor campaña'
          }
          value={
            isSpecificView
              ? `$${Number(revenue).toFixed(2)}`
              : bestCampaign
              ? (
                  bestCampaign.totalSent || 0
                ).toLocaleString()
              : 0
          }
          color="text-green-400"
        />

      </div>

      {/* GRAFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800">
          <h3 className="text-lg text-gray-400 mb-4">
            Evolución de campañas 📈
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <LineChart data={chartData}>
              <CartesianGrid stroke="#333" />
              <XAxis
                dataKey="date"
                stroke="#aaa"
              />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="emails"
                stroke="#22c55e"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="opens"
                stroke="#3b82f6"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#eab308"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="purchases"
                stroke="#f472b6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800">
          <h3 className="text-lg text-gray-400 mb-4">
            Funnel de conversión
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart data={funnelData}>
              <CartesianGrid stroke="#333" />
              <XAxis
                dataKey="name"
                stroke="#aaa"
              />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* TOP EVENTO */}
      <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800 mb-8">
        <h3 className="text-lg text-gray-400 mb-2">
          Evento más clickeado
        </h3>

        {topEvent ? (
          <>
            <p className="text-2xl font-bold text-yellow-400">
              {topEvent.title}
            </p>
            <p className="text-gray-400 mt-1">
              Clicks: {topEvent.clicks}
            </p>
          </>
        ) : (
          <p className="text-gray-500">
            Sin clicks aún
          </p>
        )}
      </div>

      {/* TABLA */}
      <div className="bg-zinc-900 rounded-2xl p-4 shadow overflow-x-auto border border-zinc-800">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              Campañas enviadas
            </h3>

            <p className="text-sm text-gray-500">
              Haz click para ver métricas específicas
            </p>
          </div>

          {campaignLoading && (
            <p className="text-sm text-blue-400">
              Cargando campaña...
            </p>
          )}
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-zinc-700">
              <th className="py-2">Nombre</th>
              <th>Eventos</th>
              <th>Emails</th>
              <th>Fecha</th>
            </tr>
          </thead>

          <tbody>
            {campaigns.map((c, index) => {
              const isSelected =
                selectedCampaign?.id === c.id;

              return (
                <tr
                  key={c.id || index}
                  onClick={() =>
                    handleSelectCampaign(c)
                  }
                  className={`border-b border-zinc-800 cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-950/50 hover:bg-blue-950/70'
                      : 'hover:bg-zinc-800'
                  }`}
                >
                  <td className="py-3">
                    {c.name}
                  </td>

                  <td>
                    {Array.isArray(c.eventIds)
                      ? c.eventIds.length
                      : 0}
                  </td>

                  <td>
                    {(c.totalSent || 0).toLocaleString()}
                  </td>

                  <td>
                    {new Date(
                      c.createdAt,
                    ).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      
            {/* PDF REPORT OCULTO */}
      <div
        ref={pdfReportRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '794px',
          minHeight: '1123px',
          background: '#050505',
          color: '#ffffff',
          padding: '32px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <img
            src={logoPronto}
            alt="ProntoTicketLive"
            style={{ width: 170, height: 'auto' }}
          />

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              Campaign Report
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #0b1220, #111827)',
            border: '1px solid #1f2937',
            borderRadius: 18,
            padding: 22,
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
            {isSpecificView ? 'Campaña específica' : 'Resumen global de campañas'}
          </div>

          <div style={{ fontSize: 26, fontWeight: 900, color: '#ffffff' }}>
            {isSpecificView
              ? selectedCampaign?.name || 'Campaña seleccionada'
              : 'ProntoTicketLive Campaign Performance'}
          </div>

          <div style={{ fontSize: 30, fontWeight: 900, color: '#f59e0b', marginTop: 14 }}>
            {money(revenue)}
          </div>

          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
            Revenue atribuido a campañas y conversiones registradas.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
          <PdfKpi title="Emails" value={number(totalEmails)} color="#22c55e" />
          <PdfKpi title="Aperturas" value={number(totalOpens)} color="#3b82f6" />
          <PdfKpi title="Clicks" value={number(totalClicks)} color="#eab308" />
          <PdfKpi title="Compras" value={number(purchases)} color="#10b981" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <PdfKpi title="CTR" value={`${ctr}%`} color="#a855f7" />
          <PdfKpi title="Open Rate" value={`${openRate}%`} color="#38bdf8" />
          <PdfKpi title="Conversion" value={`${conversionRate}%`} color="#f472b6" />
          <PdfKpi title="Revenue" value={money(revenue)} color="#f97316" />
        </div>

        <div
          style={{
            background: '#111111',
            border: '1px solid #27272a',
            borderRadius: 18,
            padding: 18,
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>
            Funnel de conversión
          </div>

          <PdfFunnelRow label="Emails enviados" value={totalEmails} max={totalEmails} color="#22c55e" />
          <PdfFunnelRow label="Aperturas" value={totalOpens} max={totalEmails} color="#3b82f6" />
          <PdfFunnelRow label="Clicks" value={totalClicks} max={totalEmails} color="#eab308" />
          <PdfFunnelRow label="Compras" value={purchases} max={totalEmails} color="#10b981" />
        </div>

        <div
          style={{
            background: '#111111',
            border: '1px solid #27272a',
            borderRadius: 18,
            padding: 18,
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>
            Evento más clickeado
          </div>

          {topEvent ? (
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#eab308' }}>
                {topEvent.title || 'Evento sin nombre'}
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
                Clicks registrados: {number(topEvent.clicks || 0)}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#9ca3af' }}>
              Sin clicks registrados todavía.
            </div>
          )}
        </div>

        <div
          style={{
            background: '#111111',
            border: '1px solid #27272a',
            borderRadius: 18,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>
            Insights ejecutivos
          </div>

          <div style={{ fontSize: 13, color: '#22c55e', marginBottom: 8 }}>
            💰 Revenue generado: <strong>{money(revenue)}</strong>
          </div>

          <div style={{ fontSize: 13, color: '#38bdf8', marginBottom: 8 }}>
            📬 Open Rate: <strong>{openRate}%</strong>
          </div>

          <div style={{ fontSize: 13, color: '#f472b6', marginBottom: 8 }}>
            🎟 Conversión click → compra: <strong>{conversionRate}%</strong>
          </div>

          {topEvent && (
            <div style={{ fontSize: 13, color: '#eab308' }}>
              🏆 Evento con mayor interés: <strong>{topEvent.title}</strong>
            </div>
          )}
        </div>

        <div style={{ marginTop: 22, fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
          © 2026 ProntoTicketLive — Reporte generado automáticamente desde Campaign Analytics.
        </div>
      </div>


    </div>
  );
}

function CardSmall({
  title,
  value,
  color = 'text-white',
}) {
  return (
    <div className="bg-zinc-900 p-4 rounded-2xl shadow border border-zinc-800">
      <h2 className="text-sm text-gray-400">
        {title}
      </h2>
      <p className={`text-2xl font-bold mt-2 ${color}`}>
        {value}
      </p>
    </div>
  );
}

function CardBig({
  title,
  value,
  color = 'text-white',
}) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800">
      <h2 className="text-lg text-gray-400">
        {title}
      </h2>
      <p className={`text-3xl font-bold mt-2 ${color}`}>
        {value}
      </p>
    </div>
  );
}

function PdfKpi({ title, value, color }) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #27272a',
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 11, color: '#9ca3af' }}>
        {title}
      </div>

      <div style={{ fontSize: 18, fontWeight: 800, color, marginTop: 5 }}>
        {value}
      </div>
    </div>
  );
}

function PdfFunnelRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((Number(value || 0) / Number(max || 1)) * 100, 100) : 0;

  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div style={{ height: 7, background: '#27272a', borderRadius: 20 }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 20,
            background: color,
          }}
        />
      </div>
    </div>
  );
}