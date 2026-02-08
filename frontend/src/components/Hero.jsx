import React from 'react';
import SearchBar from './SearchBar';

const Hero = () => {
  return (
    <div className="relative h-[45vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Concert Scene */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1757987074039-be966fa797e5?q=80&w=2000')`
        }}
      />
      
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Watermark Logo - Subtle integration among lights */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08]">
        <img
          src="https://customer-assets.emergentagent.com/job_df4a73ed-0c0c-4268-9eaf-d95c4450d1cd/artifacts/bgf87i71_PRONTOlive.png"
          alt="ProntoTicketLive Watermark"
          className="w-[50%] max-w-xl"
          style={{ filter: 'brightness(1.2)' }}
        />
      </div>
      
      {/* Smooth bottom gradient blur that fades to black */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <div className="space-y-8">
          {/* Main Headline */}
          <div className="space-y-3">
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1] text-shadow-premium"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Compra entradas para los mejores eventos
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl font-semibold text-white/90 tracking-wide">
              Fácil, rápido y seguro
            </p>
          </div>

          {/* Search Bar */}
          <div className="pt-6">
            <SearchBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
