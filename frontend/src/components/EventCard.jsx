import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Ticket } from 'lucide-react';

const EventCard = ({ event, featured = false }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Extract numeric ID from event.id (e.g., 'featured-1' -> '1')
    const eventId = event.id.split('-').pop();
    navigate(`/evento/${eventId}`);
  };

  const handleBuyClick = (e) => {
    e.stopPropagation();
    const eventId = event.id.split('-').pop();
    navigate(`/evento/${eventId}`);
  };

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
            <span className="text-xs font-semibold tracking-wide">{event.date}</span>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Category */}
        <div className="inline-block">
          <span className="text-[11px] font-semibold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-full border border-[#007AFF]/20 tracking-wide uppercase">
            {event.category}
          </span>
        </div>

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
          <span className="text-[13px] line-clamp-1 tracking-wide">{event.venue}</span>
        </div>

        {/* Price and Button */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/5">
          <div className="flex items-baseline space-x-1.5">
            <div className="text-[11px] text-white/50 font-medium tracking-wide uppercase">Desde</div>
            <div className="text-2xl font-bold text-[#FF9500] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ${event.price}
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
