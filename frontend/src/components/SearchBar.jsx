import React from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';

const SearchBar = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Event Name */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3.5 hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/10">
            <Search className="text-[#007AFF] flex-shrink-0" size={18} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Nombre del evento"
              className="bg-transparent text-white text-sm placeholder:text-white/40 outline-none w-full tracking-wide"
              data-testid="search-input-event"
            />
          </div>

          {/* City */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3.5 hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/10">
            <MapPin className="text-[#FF9500] flex-shrink-0" size={18} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Ciudad"
              className="bg-transparent text-white text-sm placeholder:text-white/40 outline-none w-full tracking-wide"
              data-testid="search-input-city"
            />
          </div>

          {/* Venue */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3.5 hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/10">
            <Calendar className="text-[#007AFF] flex-shrink-0" size={18} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Sede o fecha"
              className="bg-transparent text-white text-sm placeholder:text-white/40 outline-none w-full tracking-wide"
              data-testid="search-input-venue"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          className="w-full mt-3 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[0_8px_30px_rgba(0,122,255,0.5)] active:scale-[0.98] tracking-wide"
          data-testid="search-button"
        >
          Buscar Eventos
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
