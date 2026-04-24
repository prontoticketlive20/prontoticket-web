import React, { useEffect, useState } from 'react';
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

export default function CampaignDashboard() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSent: 0,
    totalClicks: 0,
    totalOpens: 0,
    ctr: 0,
    openRate: 0,
    topEvents: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const statsRes = await api.get('/mail/campaign-stats');
      const analyticsRes = await api.get('/mail/analytics');

      const statsData = statsRes.data?.data || statsRes.data || {};
      const analyticsData =
  analyticsRes.data?.data?.data ||
  analyticsRes.data?.data ||
  analyticsRes.data ||
  {};

      setCampaigns(statsData.campaigns || []);

      const totalSent = analyticsData.totalSent || statsData.totalEmailsSent || 0;
      const totalClicks = analyticsData.totalClicks || 0;
      const totalOpens = analyticsData.totalOpens || 0;

      setAnalytics({
        totalSent,
        totalClicks,
        totalOpens,
        ctr:
          analyticsData.ctr ??
          (totalSent > 0 ? Number(((totalClicks / totalSent) * 100).toFixed(2)) : 0),
        openRate:
          analyticsData.openRate ??
          (totalSent > 0 ? Number(((totalOpens / totalSent) * 100).toFixed(2)) : 0),
        topEvents: analyticsData.topEvents || [],
      });
    } catch (err) {
      console.error('Error cargando analytics de campañas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-white p-10 text-center bg-black min-h-screen">
        Cargando campañas...
      </div>
    );
  }

  const totalCampaigns = campaigns.length;
  const totalEmails = analytics.totalSent;
  const totalOpens = analytics.totalOpens;
  const totalClicks = analytics.totalClicks;
  const ctr = analytics.ctr;
  const openRate = analytics.openRate;

  const avgEmails =
    campaigns.length > 0
      ? Math.round(totalEmails / campaigns.length)
      : 0;

  const bestCampaign = campaigns.reduce((best, current) => {
    if (!best) return current;
    return (current.totalSent || 0) > (best.totalSent || 0)
      ? current
      : best;
  }, null);

  const chartData = campaigns.map(c => ({
    date: new Date(c.createdAt).toLocaleDateString(),
    emails: c.totalSent || 0,
    opens: c.totalOpens || 0,
    clicks: c.totalClicks || 0,
  }));

  const funnelData = [
    { name: 'Enviados', value: totalEmails },
    { name: 'Aperturas', value: totalOpens },
    { name: 'Clicks', value: totalClicks },
  ];

  const topEvent = analytics.topEvents?.[0];

  return (
    <div className="p-6 text-white bg-black min-h-screen">

      {/* 🔥 HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            📧 Dashboard de Campañas
          </h1>
          <p className="text-gray-400 mt-1">
            Analytics de marketing, aperturas, clicks y rendimiento de campañas.
          </p>
        </div>

        <button
          onClick={() => window.location.href = '/admin/campaigns/create'}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold transition"
        >
          + Crear Campaña
        </button>
      </div>

      {/* 🔥 KPIs PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">

        <div className="bg-zinc-900 p-5 rounded-2xl shadow border border-zinc-800">
          <h2 className="text-sm text-gray-400">Campañas</h2>
          <p className="text-3xl font-bold mt-2">
            {totalCampaigns}
          </p>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl shadow border border-zinc-800">
          <h2 className="text-sm text-gray-400">Emails enviados</h2>
          <p className="text-3xl font-bold mt-2 text-green-400">
            {totalEmails.toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl shadow border border-zinc-800">
          <h2 className="text-sm text-gray-400">Aperturas</h2>
          <p className="text-3xl font-bold mt-2 text-blue-400">
            {totalOpens.toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl shadow border border-zinc-800">
          <h2 className="text-sm text-gray-400">Clicks</h2>
          <p className="text-3xl font-bold mt-2 text-yellow-400">
            {totalClicks.toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl shadow border border-zinc-800">
          <h2 className="text-sm text-gray-400">CTR</h2>
          <p className="text-3xl font-bold mt-2 text-purple-400">
            {ctr}%
          </p>
        </div>

      </div>

      {/* 🔥 KPIs AVANZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800">
          <h2 className="text-lg text-gray-400">Open Rate</h2>
          <p className="text-3xl font-bold mt-2 text-blue-400">
            {openRate}%
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800">
          <h2 className="text-lg text-gray-400">Promedio por campaña</h2>
          <p className="text-3xl font-bold mt-2">
            {avgEmails.toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800">
          <h2 className="text-lg text-gray-400">Mejor campaña</h2>
          <p className="text-3xl font-bold mt-2 text-green-400">
            {bestCampaign ? (bestCampaign.totalSent || 0).toLocaleString() : 0}
          </p>
        </div>

      </div>

      {/* 🔥 GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800">
          <h3 className="text-lg text-gray-400 mb-4">
            Evolución de campañas 📈
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#333" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Line type="monotone" dataKey="emails" stroke="#22c55e" strokeWidth={3} />
              <Line type="monotone" dataKey="opens" stroke="#3b82f6" strokeWidth={3} />
              <Line type="monotone" dataKey="clicks" stroke="#eab308" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800">
          <h3 className="text-lg text-gray-400 mb-4">
            Funnel de conversión
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid stroke="#333" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* 🔥 TOP EVENTO */}
      <div className="bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800 mb-8">
        <h3 className="text-lg text-gray-400 mb-2">
          Evento más clickeado
        </h3>

        {topEvent ? (
          <div>
            <p className="text-2xl font-bold text-yellow-400">
              {topEvent.title || topEvent.eventTitle || 'Evento sin nombre'}
            </p>
            <p className="text-gray-400 mt-1">
              Clicks: {topEvent.clicks || topEvent.totalClicks || 0}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">
            Todavía no hay clicks registrados.
          </p>
        )}
      </div>

      {/* 🔥 TABLA */}
      <div className="bg-zinc-900 rounded-2xl p-4 shadow overflow-x-auto border border-zinc-800">

        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-zinc-700">
              <th className="py-2">Nombre</th>
              <th>Eventos</th>
              <th>Filtros</th>
              <th>Emails</th>
              <th>Fecha</th>
            </tr>
          </thead>

          <tbody>
            {campaigns.map((c, index) => (
              <tr
                key={c.id || index}
                className="border-b border-zinc-800 hover:bg-zinc-800"
              >
                <td className="py-3">{c.name}</td>

                <td>
                  {Array.isArray(c.eventIds)
                    ? c.eventIds.length
                    : 0}
                </td>

                <td>
                  {c.filters
                    ? JSON.stringify(c.filters)
                    : '-'}
                </td>

                <td>{(c.totalSent || 0).toLocaleString()}</td>

                <td>
                  {new Date(c.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>

        </table>

        {campaigns.length === 0 && (
          <div className="text-center mt-6 text-gray-500">
            No hay campañas aún 🚀
          </div>
        )}

      </div>

    </div>
  );
}