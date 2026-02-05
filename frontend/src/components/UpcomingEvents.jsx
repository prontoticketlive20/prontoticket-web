import React from 'react';
import EventCard from './EventCard';
import { Clock } from 'lucide-react';

const UpcomingEvents = () => {
  const upcomingEvents = [
    {
      id: 'upcoming-1',
      title: 'Electrónica bajo las Estrellas',
      date: '18 JUN',
      venue: 'Palacio de los Deportes, CDMX',
      category: 'Electrónica',
      price: '550',
      image: 'https://images.unsplash.com/photo-1624929303661-22c5bce0169b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxtdXNpYyUyMGZlc3RpdmFsJTIwc3RhZ2UlMjBwZXJmb3JtYW5jZXxlbnwwfHx8fDE3NzAyNDgzNjd8MA&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'upcoming-2',
      title: 'Jazz & Blues Night',
      date: '25 JUN',
      venue: 'Teatro Metropolitan, CDMX',
      category: 'Jazz',
      price: '480',
      image: 'https://images.unsplash.com/photo-1719650932800-ebb72adb2d2a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxsaXZlJTIwY29uY2VydCUyMHN0YWdlJTIwbGlnaHRzJTIwY3Jvd2QlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODMyMnww&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'upcoming-3',
      title: 'Reggaetón Fest 2025',
      date: '02 JUL',
      venue: 'Foro Sol, Ciudad de México',
      category: 'Reggaetón',
      price: '720',
      image: 'https://images.unsplash.com/photo-1766019463317-1cc801c15e61?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHxsaXZlJTIwY29uY2VydCUyMHN0YWdlJTIwbGlnaHRzJTIwY3Jvd2QlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODMyMnww&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'upcoming-4',
      title: 'Indie Rock Showcase',
      date: '10 JUL',
      venue: 'Lunario del Auditorio, CDMX',
      category: 'Rock Indie',
      price: '420',
      image: 'https://images.unsplash.com/photo-1765278797923-10a027f5c69d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBsaWdodHMlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODM2Nnww&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'upcoming-5',
      title: 'Salsa y Más Festival',
      date: '15 JUL',
      venue: 'Centro Banamex, CDMX',
      category: 'Salsa',
      price: '390',
      image: 'https://images.unsplash.com/photo-1762788109971-29b299b2b4ef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxjb25jZXJ0JTIwY3Jvd2QlMjBsaWdodHMlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODM2Nnww&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'upcoming-6',
      title: 'Hip Hop Evolution Tour',
      date: '20 JUL',
      venue: 'Arena Ciudad de México',
      category: 'Hip Hop',
      price: '680',
      image: 'https://images.unsplash.com/photo-1719650932798-bda508a2b209?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGZlc3RpdmFsJTIwc3RhZ2UlMjBwZXJmb3JtYW5jZXxlbnwwfHx8fDE3NzAyNDgzNjd8MA&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'upcoming-7',
      title: 'Tributo a los 90s',
      date: '28 JUL',
      venue: 'Pepsi Center, CDMX',
      category: 'Pop/Rock',
      price: '590',
      image: 'https://images.unsplash.com/photo-1624929303661-22c5bce0169b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxtdXNpYyUyMGZlc3RpdmFsJTIwc3RhZ2UlMjBwZXJmb3JtYW5jZXxlbnwwfHx8fDE3NzAyNDgzNjd8MA&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'upcoming-8',
      title: 'Banda Sinaloense en Vivo',
      date: '05 AGO',
      venue: 'Auditorio Telmex, Guadalajara',
      category: 'Banda',
      price: '520',
      image: 'https://images.unsplash.com/photo-1719650932800-ebb72adb2d2a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxsaXZlJTIwY29uY2VydCUyMHN0YWdlJTIwbGlnaHRzJTIwY3Jvd2QlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODMyMnww&ixlib=rb-4.1.0&q=85'
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-[#0A0A0A] to-[#121212]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-4">
            <Clock className="text-[#007AFF]" size={28} strokeWidth={2} />
            <h2 
              className="text-3xl md:text-4xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Próximos Eventos
            </h2>
          </div>
        </div>

        {/* Upcoming Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-8">
          <button
            className="px-8 py-3 bg-white/10 text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/20 border border-white/10 hover:border-white/30 active:scale-95"
            data-testid="load-more-events-button"
          >
            Cargar Más Eventos
          </button>
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
