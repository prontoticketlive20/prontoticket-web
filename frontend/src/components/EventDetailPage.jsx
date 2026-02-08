import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import TicketSelection from './TicketSelection';
import { Calendar, MapPin, Clock, Users, Info, AlertCircle } from 'lucide-react';

// Mock event data - en producción vendría de API
const mockEvents = {
  '1': {
    id: '1',
    title: 'Festival Músical Verano 2025',
    type: 'general', // 'general' o 'seated'
    date: '15 JUN 2025',
    time: '18:00',
    venue: 'Estadio Nacional',
    location: 'Ciudad de México, México',
    startingPrice: 899,
    image: 'https://images.unsplash.com/photo-1765278797923-10a027f5c69d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBsaWdodHMlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODM2Nnww&ixlib=rb-4.1.0&q=85',
    description: 'Disfruta del festival de verano más esperado del año con los mejores artistas nacionales e internacionales. Una experiencia única con más de 12 horas de música en vivo, escenarios múltiples y una producción de clase mundial.',
    ageLimit: '18+',
    doors: '17:00',
    duration: '6 horas',
    policies: [
      'Prohibido el ingreso de alimentos y bebidas',
      'No se permiten cámaras profesionales',
      'El boleto es personal e intransferible',
      'Reembolsos disponibles hasta 7 días antes del evento'
    ],
    ticketTypes: [
      { id: 't1', name: 'General', price: 899, available: 250 },
      { id: 't2', name: 'VIP', price: 1499, available: 80 },
      { id: 't3', name: 'Platino', price: 2499, available: 30 }
    ]
  },
  '2': {
    id: '2',
    title: 'Teatro: Noche de Gala',
    type: 'seated',
    date: '28 JUL 2025',
    time: '20:00',
    venue: 'Teatro Metropolitan',
    location: 'Ciudad de México, México',
    startingPrice: 450,
    image: 'https://images.unsplash.com/photo-1719650932800-ebb72adb2d2a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxsaXZlJTIwY29uY2VydCUyMHN0YWdlJTIwbGlnaHRzJTIwY3Jvd2QlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODMyMnww&ixlib=rb-4.1.0&q=85',
    description: 'Una velada espectacular de teatro y música en vivo. Presentación única de la obra más aclamada de la temporada con un elenco de primer nivel.',
    ageLimit: 'Todas las edades',
    doors: '19:00',
    duration: '2.5 horas',
    policies: [
      'Se requiere código de vestimenta formal',
      'Prohibido el uso de celulares durante la función',
      'Los asientos son numerados y asignados',
      'Reembolsos disponibles hasta 14 días antes del evento'
    ],
    sections: [
      { id: 's1', name: 'Platea A', price: 1200, available: 45 },
      { id: 's2', name: 'Platea B', price: 950, available: 78 },
      { id: 's3', name: 'Palco', price: 1800, available: 12 },
      { id: 's4', name: 'Luneta', price: 450, available: 150 }
    ]
  }
};

const EventDetailPage = () => {
  const { id } = useParams();
  const [showTicketSelection, setShowTicketSelection] = useState(false);
  
  // Get event data
  const event = mockEvents[id] || mockEvents['1'];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      
      {/* Event Hero */}
      <div className="relative h-[50vh] min-h-[400px] mt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${event.image}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
      </div>

      {/* Event Content */}
      <div className="relative -mt-32 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#121212] rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl">
            
            {/* Event Header */}
            <div className="space-y-6 mb-8 pb-8 border-b border-white/10">
              {/* Event Title */}
              <h1 
                className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
                data-testid="event-title"
              >
                {event.title}
              </h1>

              {/* Event Meta Info */}
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
                    <div className="text-white font-semibold">{event.venue}</div>
                    <div className="text-white/60 text-sm">{event.location}</div>
                  </div>
                </div>
              </div>

              {/* Price and CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                <div>
                  <div className="text-sm text-white/50 uppercase tracking-wide mb-1">Precio desde</div>
                  <div className="text-4xl font-bold text-[#FF9500] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    ${event.startingPrice}
                  </div>
                </div>
                <button
                  onClick={() => setShowTicketSelection(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-base font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[0_8px_30px_rgba(0,122,255,0.6)] active:scale-95 tracking-wide"
                  data-testid="select-tickets-button"
                >
                  Seleccionar entradas
                </button>
              </div>
            </div>

            {/* Event Description */}
            <div className="space-y-6 mb-8 pb-8 border-b border-white/10">
              <h2 
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Descripción del evento
              </h2>
              <p className="text-white/70 leading-relaxed text-base">
                {event.description}
              </p>
            </div>

            {/* Event Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-white/10">
              <div className="flex items-start space-x-3">
                <Clock className="text-[#007AFF] flex-shrink-0 mt-1" size={18} strokeWidth={2} />
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Puertas abren</div>
                  <div className="text-white font-semibold">{event.doors} hrs</div>
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

            {/* Policies */}
            <div className="space-y-4">
              <h3 
                className="text-xl font-bold text-white tracking-tight flex items-center space-x-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <AlertCircle className="text-[#FF9500]" size={22} strokeWidth={2} />
                <span>Políticas del evento</span>
              </h3>
              <ul className="space-y-2">
                {event.policies.map((policy, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-[#007AFF] mt-1">•</span>
                    <span className="text-white/70 text-sm">{policy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sticky Bottom CTA (Mobile) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 p-4 z-40">
            <button
              onClick={() => setShowTicketSelection(true)}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-base font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg active:scale-95"
              data-testid="mobile-select-tickets-button"
            >
              Seleccionar entradas
            </button>
          </div>
        </div>
      </div>

      {/* Spacing before footer */}
      <div className="h-20" />

      <Footer />

      {/* Ticket Selection Modal/Overlay */}
      {showTicketSelection && (
        <TicketSelection 
          event={event}
          onClose={() => setShowTicketSelection(false)}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
