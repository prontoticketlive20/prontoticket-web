import React from 'react';
import SearchBar from './SearchBar';

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1766019463317-1cc801c15e61?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHxsaXZlJTIwY29uY2VydCUyMHN0YWdlJTIwbGlnaHRzJTIwY3Jvd2QlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODMyMnww&ixlib=rb-4.1.0&q=85')`
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
      
      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="https://customer-assets.emergentagent.com/job_df4a73ed-0c0c-4268-9eaf-d95c4450d1cd/artifacts/bgf87i71_PRONTOlive.png"
          alt="ProntoTicketLive Watermark"
          className="w-[60%] max-w-2xl opacity-10"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-16">
        <div className="space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h1 
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white animate-fade-in"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Fácil, Rápido y Seguro
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Tu plataforma de confianza para comprar tickets de los mejores eventos en vivo. 
              Disfruta de tus artistas favoritos sin complicaciones.
            </p>
          </div>

          {/* Search Bar */}
          <div className="pt-8">
            <SearchBar />
          </div>

          {/* Stats or Trust Indicators */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto pt-12">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#007AFF]" style={{ fontFamily: "'Outfit', sans-serif" }}>500K+</div>
              <div className="text-sm md:text-base text-white/60 mt-1">Tickets Vendidos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#FF9500]" style={{ fontFamily: "'Outfit', sans-serif" }}>1,200+</div>
              <div className="text-sm md:text-base text-white/60 mt-1">Eventos Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#007AFF]" style={{ fontFamily: "'Outfit', sans-serif" }}>98%</div>
              <div className="text-sm md:text-base text-white/60 mt-1">Satisfacción</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
