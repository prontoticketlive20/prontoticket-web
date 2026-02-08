import React from 'react';
import { Search, MapPin } from 'lucide-react';

const SearchBar = () => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl p-2 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Event/Artist/Venue */}
          <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-5 py-4 hover:bg-gray-100 transition-all duration-200">
            <Search className="text-[#007AFF] flex-shrink-0" size={20} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Evento, artista o sede"
              className="bg-transparent text-gray-900 text-base placeholder:text-gray-400 outline-none w-full font-medium"
              data-testid="search-input-event"
            />
          </div>

          {/* City/Country */}
          <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-5 py-4 hover:bg-gray-100 transition-all duration-200">
            <MapPin className="text-[#FF9500] flex-shrink-0" size={20} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Ciudad o país"
              className="bg-transparent text-gray-900 text-base placeholder:text-gray-400 outline-none w-full font-medium"
              data-testid="search-input-city"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          className="w-full mt-2 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-base font-bold rounded-xl transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-xl active:scale-[0.98] tracking-wide"
          data-testid="search-button"
        >
          Buscar eventos
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
