import React from 'react';
import { Calendar, MapPin, Ticket } from 'lucide-react';

const EventCard = ({ event, featured = false }) => {
  return (
    <div 
      className={`group relative overflow-hidden rounded-xl bg-[#121212] border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_0_30px_-5px_rgba(0,122,255,0.3)] ${
        featured ? 'h-full' : ''
      }`}
      data-testid={`event-card-${event.id}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/9]">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Date Badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-white/10">
          <div className="flex items-center space-x-1.5 text-white">
            <Calendar size={14} />
            <span className="text-xs font-semibold">{event.date}</span>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {/* Category */}
        <div className="inline-block">
          <span className="text-xs font-semibold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-1 rounded-full border border-[#007AFF]/20">
            {event.category}
          </span>
        </div>

        {/* Title */}
        <h3 
          className="text-lg font-bold text-white line-clamp-2 group-hover:text-[#007AFF] transition-colors duration-200 leading-tight"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {event.title}
        </h3>

        {/* Location */}
        <div className="flex items-center space-x-1.5 text-white/60">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="text-xs line-clamp-1">{event.venue}</span>
        </div>

        {/* Price and Button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-baseline space-x-1.5">
            <div className="text-xs text-white/50 font-medium">Desde</div>
            <div className="text-2xl font-bold text-[#FF9500]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ${event.price}
            </div>
          </div>
          <button
            className="event-buy-button flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-sm font-semibold rounded-full transition-all duration-300 hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(0,122,255,0.4)]"
            data-testid={`buy-ticket-button-${event.id}`}
          >
            <Ticket size={16} />
            <span>Comprar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
