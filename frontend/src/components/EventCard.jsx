import React from 'react';
import { Calendar, MapPin, Ticket } from 'lucide-react';

const EventCard = ({ event, featured = false }) => {
  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl bg-[#121212] border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_0_30px_-5px_rgba(0,122,255,0.3)] ${
        featured ? 'h-full' : ''
      }`}
      data-testid={`event-card-${event.id}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/10]">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Date Badge */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
          <div className="flex items-center space-x-2 text-white">
            <Calendar size={16} />
            <span className="text-sm font-semibold">{event.date}</span>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Category */}
        <div className="inline-block">
          <span className="text-xs font-semibold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1 rounded-full border border-[#007AFF]/20">
            {event.category}
          </span>
        </div>

        {/* Title */}
        <h3 
          className="text-xl font-bold text-white line-clamp-2 group-hover:text-[#007AFF] transition-colors duration-200"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {event.title}
        </h3>

        {/* Location */}
        <div className="flex items-center space-x-2 text-white/60">
          <MapPin size={16} className="flex-shrink-0" />
          <span className="text-sm">{event.venue}</span>
        </div>

        {/* Price and Button */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-xs text-white/40">Desde</div>
            <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ${event.price}
            </div>
          </div>
          <button
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold rounded-full transition-all duration-300 hover:brightness-110 active:scale-95 opacity-0 group-hover:opacity-100 shadow-[0_0_20px_rgba(0,122,255,0.4)]"
            data-testid={`buy-ticket-button-${event.id}`}
          >
            <Ticket size={18} />
            <span>Comprar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
