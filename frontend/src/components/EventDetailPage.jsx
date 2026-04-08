import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import TicketSelection from './TicketSelection';
import FunctionSelector from './FunctionSelector';
import { fetchEventById } from '../services/events.service';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Info,
  AlertCircle,
  Mail,
  Phone,
  AlertTriangle,
} from 'lucide-react';

import { usePurchase } from '../context/PurchaseContext';
import { loadEventPixels, trackViewContent } from "../utils/eventPixels";
import api from '../api/api';  //analytics

const VALID_SALE_TYPES = ['seated', 'general'];

const DEFAULT_POLICIES = [
  'El boleto es personal e intransferible',
  'No se permiten cámaras profesionales',
  'Prohibido el ingreso de alimentos y bebidas',
];

const FALLBACK_EVENT = (id) => ({
  id,
  title: 'Evento no disponible',
  description: 'No se pudo cargar el evento desde el backend.',
  saleType: 'general',
  image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200',
  date: '',
  time: '',
  venue: '',
  location: '',
  city: '',
  country: 'México',
  startingPrice: 0,
  ageLimit: 'Todas las edades',
  doors: '—',
  duration: '—',
  youtubeUrl: '',
  useExternalTicket: false,
  externalTicketUrl: '',
  producerContact: null,
  functions: [],
  ticketTypes: [],
});

const getYoutubeEmbedUrl = (url) => {
  if (!url) return '';

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      const videoId = parsedUrl.pathname.replace('/', '').trim();
      return videoId
        ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`
        : '';
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      const videoId = parsedUrl.searchParams.get('v');
      return videoId
        ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`
        : '';
    }

    return '';
  } catch {
    return '';
  }
};

const normalizeFunction = (func) => {
  if (!func) return null;

  return {
    ...func,
    taxRate: Number(func.taxRate || 0),
  };
};

const normalizeEventFunctions = (evt) => {
  if (!evt) return evt;

  const functions = Array.isArray(evt.functions)
    ? evt.functions
        .filter((func) => func.isActive !== false) // 🔥 FIX REAL
        .map((func) => normalizeFunction(func))
    : [];

  return {
    ...evt,
    functions,
  };
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showTicketSelection, setShowTicketSelection] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);

  const [event, setEvent] = useState(null);
  const [policies, setPolicies] = useState(DEFAULT_POLICIES);

  const { selectEvent, selectFunction: setContextFunction } = usePurchase();

  useEffect(() => {
         if (!event?.id) return;

         api.post('/orders/analytics/view', {
           eventId: event.id,
           functionId: selectedFunction?.id || '',
         });
    }, [event?.id, selectedFunction?.id]);

  useEffect(() => {

    let mounted = true;

    const load = async () => {
      try {
        const rawEvent = await fetchEventById(id);
        const normalized = normalizeEventFunctions(rawEvent);

        console.log('EVENT NORMALIZED:', normalized);

        if (!mounted) return;

        setEvent(normalized);
        selectEvent(normalized);
        loadEventPixels(normalized);
        trackViewContent(normalized);
        setPolicies(DEFAULT_POLICIES);

            
        if (normalized?.functions?.length === 1) {
          const singleFunc = normalizeFunction(normalized.functions[0]);
          setSelectedFunction(singleFunc);
          setContextFunction(singleFunc);
        } else {
          setSelectedFunction(null);
          setContextFunction(null);
        }
      } catch (e) {
        console.error('[EventDetailPage] Error cargando evento desde backend:', e);
        if (!mounted) return;

        const fallback = FALLBACK_EVENT(id);
        setEvent(fallback);
        selectEvent(fallback);
        setPolicies(DEFAULT_POLICIES);
      }
    };

    if (id) load();

    return () => {
      mounted = false;
    };
  }, [id, selectEvent, setContextFunction]);

  const normalizedSelectedFunction = useMemo(() => {
    if (!selectedFunction) return null;
    return normalizeFunction(selectedFunction);
  }, [selectedFunction]);

  const saleType = event?.saleType;
  const hasValidSaleType = event ? VALID_SALE_TYPES.includes(saleType) : true;
  const isSeatedEvent = saleType === 'seated';
  const isGeneralEvent = saleType === 'general';
  const hasMultipleFunctions = !!(event?.functions && event.functions.length > 1);
  const hasSingleFunction = !!(event?.functions && event.functions.length === 1);
  const canProceed =
    !!event && hasValidSaleType && (hasSingleFunction || normalizedSelectedFunction !== null);

  const youtubeEmbedUrl = getYoutubeEmbedUrl(event?.youtubeUrl);

  useEffect(() => {
    if (!event) return;
    if (!hasValidSaleType) {
      console.error(
        `[ProntoTicketLive] Invalid saleType for event "${event.title}" (ID: ${event.id}).`,
        `\nReceived: "${event.saleType}"`,
        `\nExpected: "seated" | "general"`,
        `\nPurchase flow is BLOCKED until this is fixed.`
      );
    }
  }, [event, hasValidSaleType]);

  useEffect(() => {
    if (!event) return;

    if (normalizedSelectedFunction) {
      const freshFunction =
        event.functions?.find((f) => f.id === normalizedSelectedFunction.id) ||
        normalizedSelectedFunction;

      const safeFunction = normalizeFunction(freshFunction);

      console.log('SELECTED FUNCTION SENT TO CONTEXT:', safeFunction);

      setContextFunction(safeFunction);
    }
  }, [event, normalizedSelectedFunction, setContextFunction]);

  const handleFunctionSelect = (func) => {
    const safeFunction = normalizeFunction(func);
    setSelectedFunction(safeFunction);
    setContextFunction(safeFunction);
  };

  const handleSelectTickets = async () => {

  
   // 🔥 REDIRECCIÓN PRIMERO (FIX iPHONE)
if (event.useExternalTicket && event.externalTicketUrl) {
  window.location.href = event.externalTicketUrl;

  // 🔥 ANALYTICS EN BACKGROUND (NO BLOQUEA)
  setTimeout(() => {
    try {
      console.log('CLICK ANALYTICS →', {
        eventId: event?.id,
        functionId: selectedFunction?.id
      });

      api.post('/orders/analytics/click', {
        eventId: event.id,
        functionId: selectedFunction?.id || null,
      });
    } catch (err) {
      console.error('Analytics click error', err);
    }
  }, 0);

  return;
}

if (!event) return;

if (!hasValidSaleType) {
  console.error('[ProntoTicketLive] Purchase blocked: Invalid saleType');
  return;
}

if (!canProceed) return;

if (normalizedSelectedFunction) {
  setContextFunction(normalizedSelectedFunction);
}

if (isSeatedEvent) {
  navigate(`/evento/${id}/asientos`);
} else if (isGeneralEvent) {
  setShowTicketSelection(true);
}
};

if (!event) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <div className="mt-28 max-w-5xl mx-auto px-4 text-white/80">
        Cargando evento...
      </div>
      <Footer />
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <div className="relative h-[50vh] min-h-[400px] mt-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${event.image}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
      </div>

      <div className="relative -mt-32 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#121212] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="relative w-full aspect-[21/9] overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="p-8 md:p-12">
              <div className="space-y-6 mb-8 pb-8 border-b border-white/10">
                <h1
                  className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                  data-testid="event-title"
                >
                  {event.title}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="text-[#007AFF] flex-shrink-0 mt-1" size={20} strokeWidth={2} />
                    <div>
                      <div className="text-white font-semibold">{event.date}</div>
                      <div className="text-white/60 text-sm">{event.time} hrs</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="text-[#FF9500] flex-shrink-0 mt-1" size={20} strokeWidth={2} />
                    <div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.location}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-semibold hover:text-[#007AFF] transition-colors duration-200"
                        title="Abrir en Google Maps"
                        data-testid="venue-maps-link"
                      >
                        {event.venue}
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.location}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 text-sm hover:text-[#007AFF] transition-colors duration-200 block"
                        title="Abrir en Google Maps"
                      >
                        {event.location}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                  <div>
                    <div className="text-sm text-white/50 uppercase tracking-wide mb-1">Precio desde</div>
                    <div className="text-4xl font-bold text-[#FF9500] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      ${event.startingPrice}
                    </div>
                  </div>
                  <button
                    onClick={handleSelectTickets}
                    disabled={!event.useExternalTicket && !canProceed}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-base font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[0_8px_30px_rgba(0,122,255,0.6)] active:scale-95 tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="select-tickets-button"
                  >
                    {event.useExternalTicket
                      ? 'Comprar en sitio oficial'
                      : isSeatedEvent
                      ? 'Seleccionar asientos'
                      : 'Seleccionar entradas'}
                  </button>
                </div>

                {!hasValidSaleType && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start space-x-3">
                    <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-bold text-sm">⚠️ Developer Warning</p>
                      <p className="text-red-300/80 text-xs mt-1">
                        Invalid <code className="bg-red-500/30 px-1 rounded">saleType</code>. Expected{' '}
                        <code className="bg-red-500/30 px-1 rounded">seated</code> o{' '}
                        <code className="bg-red-500/30 px-1 rounded">general</code>.
                        Received: <code className="bg-red-500/30 px-1 rounded">{String(event.saleType)}</code>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {hasValidSaleType && hasMultipleFunctions && !event.useExternalTicket && (
                <FunctionSelector
                  functions={event.functions}
                  selectedFunction={normalizedSelectedFunction}
                  onSelectFunction={handleFunctionSelect}
                />
              )}

              <div className="space-y-6 mb-8 pb-8 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Descripción del evento
                </h2>
                <p className="text-white/70 leading-relaxed text-base">
                  {event.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-white/10">
                <div className="flex items-start space-x-3">
                  <Clock className="text-[#007AFF] flex-shrink-0 mt-1" size={18} strokeWidth={2} />
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Puertas abren</div>
                    <div className="text-white font-semibold">{event.doors}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="text-[#FF9500] flex-shrink-0 mt-1" size={18} strokeWidth={2} />
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Edad mínima</div>
                    <div className="text-white font-semibold">{event.ageLimit}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Info className="text-[#007AFF] flex-shrink-0 mt-1" size={18} strokeWidth={2} />
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Duración</div>
                    <div className="text-white font-semibold">{event.duration}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8 pb-8 border-b border-white/10">
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <AlertCircle className="text-[#FF9500]" size={22} strokeWidth={2} />
                  <span>Políticas del evento</span>
                </h3>
                <ul className="space-y-2">
                  {policies.map((policy, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-[#007AFF] mt-1">•</span>
                      <span className="text-white/70 text-sm">{policy}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {event.producerContact && (
                <div className="space-y-3 mb-8 pb-8 border-b border-white/10">
                  <p className="text-sm text-white/60 tracking-wide">
                    ¿Quieres contactar o preguntar algo al productor del evento?
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Mail size={16} className="text-[#007AFF] flex-shrink-0" strokeWidth={2} />
                      <a
                        href={`mailto:${event.producerContact.email}`}
                        className="text-white/70 hover:text-[#007AFF] transition-colors duration-200 text-sm"
                      >
                        {event.producerContact.email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone size={16} className="text-[#FF9500] flex-shrink-0" strokeWidth={2} />
                      <a
                        href={`tel:${event.producerContact.phone}`}
                        className="text-white/70 hover:text-[#FF9500] transition-colors duration-200 text-sm"
                      >
                        {event.producerContact.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {youtubeEmbedUrl ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Video promocional del evento
                  </h3>
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#1E1E1E] border border-white/10">
                    <iframe
                      src={youtubeEmbedUrl}
                      title="Video promocional del evento"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 p-4 z-40">
            <button
              onClick={handleSelectTickets}
              disabled={!event.useExternalTicket && !canProceed}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-base font-bold rounded-full shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {event.useExternalTicket
                ? 'Comprar en sitio oficial'
                : isSeatedEvent
                ? 'Seleccionar asientos'
                : 'Seleccionar entradas'}
            </button>
          </div>
        </div>
      </div>

      <div className="h-20" />
      <Footer />

      {showTicketSelection && isGeneralEvent && hasValidSaleType && !event.useExternalTicket && (
        <TicketSelection
          event={event}
          onClose={() => setShowTicketSelection(false)}
        />
      )}
    </div>
  );
};

export default EventDetailPage;   