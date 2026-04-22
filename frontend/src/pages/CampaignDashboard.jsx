import React, { useEffect, useState } from 'react';
import api from '../api/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function CampaignDashboard() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalEmailsSent: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await api.get('/mail/campaign-stats');

      const responseData = res.data.data;

setCampaigns(responseData.campaigns || []);

setStats({
  totalCampaigns: responseData.totalCampaigns || 0,
  totalEmailsSent: responseData.totalEmailsSent || 0,
});

    } catch (err) {
      console.error('Error cargando campañas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-white p-10 text-center">
        Cargando campañas...
      </div>
    );
  }

  // 🔥 KPIs BASE
  const totalCampaigns = campaigns.length;

  const totalEmails = campaigns.reduce(
    (acc, c) => acc + (c.totalSent || 0),
    0
  );

  // 🔥 PROMEDIO
  const avgEmails =
    campaigns.length > 0
      ? Math.round(totalEmails / campaigns.length)
      : 0;

  // 🔥 MEJOR CAMPAÑA
  const bestCampaign = campaigns.reduce((best, current) => {
    if (!best) return current;
    return (current.totalSent || 0) > (best.totalSent || 0)
      ? current
      : best;
  }, null);

  // 🔥 DATA PARA GRÁFICO
  const chartData = campaigns.map(c => ({
    date: new Date(c.createdAt).toLocaleDateString(),
    emails: c.totalSent || 0
  }));

  return (
    <div className="p-6 text-white bg-black min-h-screen">

      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center mb-6">

  <h1 className="text-3xl font-bold">
    📧 Dashboard de Campañas
  </h1>

  <button
    onClick={() => window.location.href = '/admin/campaigns/create'}
    className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold transition"
  >
    + Crear Campaña
  </button>

</div>

      {/* 🔥 KPIs PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        <div className="bg-zinc-900 p-6 rounded-2xl shadow">
          <h2 className="text-lg text-gray-400">Total Campañas</h2>
          <p className="text-3xl font-bold mt-2">
            {totalCampaigns}
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow">
          <h2 className="text-lg text-gray-400">Emails Enviados</h2>
          <p className="text-3xl font-bold mt-2 text-green-400">
            {totalEmails.toLocaleString()}
          </p>
        </div>

      </div>

      {/* 🔥 KPIs AVANZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        <div className="bg-zinc-900 p-6 rounded-2xl shadow">
          <h2 className="text-lg text-gray-400">Promedio por campaña</h2>
          <p className="text-2xl font-bold mt-2">
            {avgEmails}
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow">
          <h2 className="text-lg text-gray-400">Mejor campaña</h2>
          <p className="text-2xl font-bold mt-2 text-green-400">
            {bestCampaign ? bestCampaign.totalSent : 0}
          </p>
        </div>

      </div>

      {/* 🔥 GRÁFICO */}
      <div className="bg-zinc-900 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-lg text-gray-400 mb-4">
          Evolución de Campañas 📈
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="date" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="emails"
              stroke="#00ff99"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 🔥 TABLA */}
      <div className="bg-zinc-900 rounded-2xl p-4 shadow overflow-x-auto">

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
                key={index}
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

                <td>{c.totalSent}</td>

                <td>
                  {new Date(c.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>

        </table>

        {/* 🔥 ESTADO VACÍO */}
        {campaigns.length === 0 && (
          <div className="text-center mt-6 text-gray-500">
            No hay campañas aún 🚀
          </div>
        )}

      </div>

    </div>
  );
}