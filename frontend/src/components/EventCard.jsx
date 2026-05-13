import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Ticket } from 'lucide-react';

const EventCard = ({ event, featured = false }) => {
  const navigate = useNavigate();

  // ✅ Banderas por país
  const getCountryCode = (country) => {
  const normalized = String(country || '').trim().toLowerCase();

  const codes = {
    'united states': 'us',
    usa: 'us',
    us: 'us',
    'estados unidos': 'us',

    do: 'do',
    rd: 'do',
    'dominican republic': 'do',
    'republica dominicana': 'do',
    'república dominicana': 'do',
    dominicana: 'do',

    ve: 've',
    venezuela: 've',

    es: 'es',
    spain: 'es',
    españa: 'es',
    espana: 'es',

    pr: 'pr',
    'puerto rico': 'pr',
  };

  return codes[normalized] || '';
};

  // ✅ Devuelve el ID correcto:
  // - Si viene un UUID real (backend), lo usa completo.
  // - Si viene un mock tipo "featured-1" / "upcoming-3", toma el "1" / "3".
  const resolveEventId = () => {
    const rawId = String(event?.id ?? '');

    // Caso mock: "featured-1", "upcoming-3"
    if (rawId.startsWith('featured-') || rawId.startsWith('upcoming-')) {
      return rawId.split('-').pop();
    }

    // Caso real: UUID completo
    return rawId;
  };

  const goToDetail = () => {
    const eventId = resolveEventId();
    if (!eventId) return;
    navigate(`/evento/${eventId}`);
  };

  const handleCardClick = () => {
    goToDetail();
  };

  const handleBuyClick = (e) => {
    e.stopPropagation();
    goToDetail();
  };

  // ✅ Precio
  const displayPrice =
    event?.startingPrice != null
      ? event.startingPrice
      : event?.price != null
      ? event.price
      : 0;

  // ✅ Venue
  const displayVenue =
    event?.venue ||
    event?.venueName ||
    event?.location ||
    '';

  // ✅ País
  const displayCountry =
    event?.country ||
    event?.countryName ||
    '';

  const countryCode = getCountryCode(displayCountry);
  
  return (
    <div
      onClick={handleCardClick}
      className={`group relative overflow-hidden rounded-2xl bg-[#121212] border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(0,122,255,0.4)] cursor-pointer ${
        featured ? 'h-full' : ''
      }`}
      data-testid={`event-card-${event.id}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/9]">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Date Badge */}
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-lg rounded-xl px-3 py-2 border border-white/10 shadow-lg">
          <div className="flex items-center space-x-2 text-white">
            <Calendar size={14} strokeWidth={2.5} />
            <span className="text-xs font-semibold tracking-wide">
              {event.date}
            </span>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Category */}
        {event.category && (
          <div className="inline-block">
            <span className="text-[11px] font-semibold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-full border border-[#007AFF]/20 tracking-wide uppercase">
              {event.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h3
          className="text-[17px] font-bold text-white line-clamp-2 group-hover:text-[#007AFF] transition-colors duration-200 leading-snug tracking-tight"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {event.title}
        </h3>

        {/* Location */}
        <div className="flex items-center space-x-2 text-white/60">
          <MapPin size={14} className="flex-shrink-0" strokeWidth={2} />

          {countryCode && (
            <img
               src={`https://flagcdn.com/w40/${countryCode}.png`}
               alt={displayCountry}
               className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
             />
           )}

          <span className="text-[13px] line-clamp-1 tracking-wide">
            {displayVenue}
          </span>
        </div>

        {/* Price and Button */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/5">
          <div className="flex items-baseline space-x-1.5">
            <div className="text-[11px] text-white/50 font-medium tracking-wide uppercase">
              Desde
            </div>

            <div
              className="text-2xl font-bold text-[#FF9500] tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              ${displayPrice}
            </div>
          </div>

          <button
            onClick={handleBuyClick}
            className="event-buy-button flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-[13px] font-semibold rounded-full transition-all duration-300 hover:brightness-110 hover:shadow-[0_4px_20px_rgba(0,122,255,0.5)] active:scale-95 shadow-lg"
            data-testid={`buy-ticket-button-${event.id}`}
          >
            <Ticket size={16} strokeWidth={2} />
            <span className="tracking-wide">Comprar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;