import React, { useEffect, useState } from 'react';
import api from '../api/api';

export default function CampaignsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterSource, setFilterSource] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events'); // ajusta si tu endpoint es otro
      setEvents(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEvent = (id) => {
    setSelectedEvents(prev =>
      prev.includes(id)
        ? prev.filter(e => e !== id)
        : [...prev, id]
    );
  };

  const now = new Date();

const filteredEvents = Array.isArray(events)
  ? events
      .filter(e => {
        const eventDate = e.functions?.[0]?.date;
        return eventDate && new Date(eventDate) > now;
      })
      .filter(e =>
        e.title?.toLowerCase().includes(search.toLowerCase())
      )
  : [];

  const sendCampaign = async () => {
    if (selectedEvents.length === 0) {
      alert('Selecciona al menos un evento');
      return;
    }

    setLoading(true);

    try {
      await api.post('/mail/send-campaign', {
      eventIds: selectedEvents,
      filters: filterSource ? { source: filterSource } : undefined,
    });

      alert(`Campaña enviada a ${res.data.recipients} usuarios 🚀`);
    } catch (err) {
      console.error(err);
      alert('Error enviando campaña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📩 Campañas</h2>

      {/* 🔍 BUSCADOR */}
      <input
  type="text"
  placeholder="Buscar evento..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{
    padding: '10px',
    width: '100%',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #2a2f3a',
    background: '#111827',
    color: '#ffffff'
  }}
/>

       <select
  value={filterSource}
  onChange={(e) => setFilterSource(e.target.value)}
  style={{
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '8px',
    border: '1px solid #2a2f3a',
    background: '#111827',
    color: '#ffffff'
  }}
>
  <option value="">🌎 Todos</option>
  <option value="USER">👤 Usuarios</option>
  <option value="ORDER">🛒 Compradores</option>
</select>


      {/* 📦 LISTA DE EVENTOS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '15px'
      }}>
        {filteredEvents.map(event => (
          <div
            key={event.id}
            style={{
              border: selectedEvents.includes(event.id)
                ? '2px solid #2563eb'
                : '1px solid #ddd',
              borderRadius: '10px',
              padding: '10px',
              cursor: 'pointer'
            }}
            onClick={() => toggleEvent(event.id)}
          >
            <img
              src={event.imageUrl}
              alt=""
              style={{
                width: '100%',
                borderRadius: '8px',
                marginBottom: '10px'
              }}
            />

            <h4>{event.title}</h4>

            <p style={{ fontSize: '12px', color: '#666' }}>
              {event.functions?.[0]?.date
                ? new Date(event.functions[0].date).toLocaleDateString()
                : 'Sin fecha'}
            </p>
          </div>
        ))}
      </div>

      {/* 🚀 BOTÓN */}
      <button
        onClick={sendCampaign}
        disabled={loading}
        style={{
          marginTop: '20px',
          padding: '12px 20px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Enviando...' : 'Enviar Campaña 🚀'}
      </button>
    </div>
  );
}