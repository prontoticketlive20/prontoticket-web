import React from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';

const SearchBar = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Event Name */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors duration-200">
            <Search className="text-[#007AFF] flex-shrink-0" size={20} />
            <input
              type="text"
              placeholder="Nombre del evento"
              className="bg-transparent text-white placeholder:text-white/40 outline-none w-full"
              data-testid="search-input-event"
            />
          </div>

          {/* City */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors duration-200">
            <MapPin className="text-[#FF9500] flex-shrink-0" size={20} />
            <input
              type="text"
              placeholder="Ciudad"
              className="bg-transparent text-white placeholder:text-white/40 outline-none w-full"
              data-testid="search-input-city"
            />
          </div>

          {/* Venue */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors duration-200">
            <Calendar className="text-[#007AFF] flex-shrink-0" size={20} />
            <input
              type="text"
              placeholder="Sede o fecha"
              className="bg-transparent text-white placeholder:text-white/40 outline-none w-full"
              data-testid="search-input-venue"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold rounded-xl transition-all duration-300 hover:brightness-110 shadow-[0_0_20px_rgba(0,122,255,0.4)] hover:shadow-[0_0_30px_rgba(0,122,255,0.6)] active:scale-[0.98]"
          data-testid="search-button"
        >
          Buscar Eventos
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
