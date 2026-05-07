import React, { useEffect, useState } from 'react';
import api from '../api/api';

export default function CampaignsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterSource, setFilterSource] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [audienceCount, setAudienceCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
  fetchAudienceCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filterSource, filterCity]);

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



const fetchAudienceCount = async () => {
  try {
    setCountLoading(true);

    const filters =
      filterSource || filterCity
        ? {
            ...(filterSource ? { source: filterSource } : {}),
            ...(filterCity ? { city: filterCity } : {}),
          }
        : undefined;

    const res = await api.post('/mail/audience-count', {
      filters,
    });

    setAudienceCount(res.data?.count || res.data?.data?.count || 0);
  } catch (err) {
    console.error('Error consultando audiencia:', err);
    setAudienceCount(null);
  } finally {
    setCountLoading(false);
  }
};



  const sendCampaign = async () => {
  if (selectedEvents.length === 0) {
    alert('Selecciona al menos un evento');
    return;
  }

  setLoading(true);

  try {
    const res = await api.post('/mail/send-campaign', {
  eventIds: selectedEvents,
  filters:
    filterSource || filterCity
      ? {
          ...(filterSource ? { source: filterSource } : {}),
          ...(filterCity ? { city: filterCity } : {}),
        }
      : undefined,
});

    alert(`Campaña enviada a ${res.data.data?.recipients || 0} usuarios 🚀`);

  } catch (err) {
    console.error(err);
    alert('Error enviando campaña');
  } finally {
    setLoading(false);
  }
};

    const sendTest = async () => {
  if (selectedEvents.length === 0) {
    alert('Selecciona al menos un evento');
    return;
  }

  setLoading(true);

  try {
    const res = await api.post('/mail/send-test', {
      eventIds: selectedEvents,
    });

    alert(`Test enviado a tu email ✅`);
  } catch (err) {
    console.error(err);
    alert('Error enviando test');
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
<option value="IMPORT">📥 Importados</option>
</select>

    <select
  value={filterCity}
  onChange={(e) => setFilterCity(e.target.value)}
  style={{
    padding: '10px',
    marginBottom: '20px',
    marginLeft: '10px',
    borderRadius: '8px',
    border: '1px solid #2a2f3a',
    background: '#111827',
    color: '#ffffff'
  }}
>
  <option value="">🏙 Todas las ciudades</option>
  <option value="Orlando">Orlando</option>
  <option value="Miami">Miami</option>
  <option value="Weston">Weston</option>
</select>

    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>
  Segmento seleccionado:{' '}
  <strong style={{ color: '#ffffff' }}>
    {filterSource || 'Todos'}
    {filterCity ? ` • ${filterCity}` : ' • Todas las ciudades'}
  </strong>

  <div style={{ marginTop: '6px' }}>
    Audiencia estimada:{' '}
    <strong style={{ color: '#22c55e' }}>
      {countLoading
        ? 'Calculando...'
        : audienceCount !== null
        ? `${audienceCount.toLocaleString()} contactos`
        : 'No disponible'}
    </strong>
  </div>
</div>

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

<button
  onClick={sendTest}
  disabled={loading}
  style={{
    marginTop: '10px',
    marginLeft: '10px',
    padding: '12px 20px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }}
>
  {loading ? 'Enviando Test...' : 'Enviar Test 🧪'}
</button>
      
    </div>
  );
}