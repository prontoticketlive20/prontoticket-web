import React from 'react';
import EventCard from './EventCard';
import { Star } from 'lucide-react';

const FeaturedEvents = () => {
  const featuredEvents = [
    {
      id: 'featured-1',
      title: 'Festival Músical Verano 2025',
      date: '15 JUN',
      venue: 'Estadio Nacional, Ciudad de México',
      category: 'Festival',
      price: '899',
      image: 'https://images.unsplash.com/photo-1765278797923-10a027f5c69d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBsaWdodHMlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODM2Nnww&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'featured-2',
      title: 'Noche de Rock Clásico',
      date: '22 JUN',
      venue: 'Arena Monterrey, Monterrey',
      category: 'Concierto',
      price: '650',
      image: 'https://images.unsplash.com/photo-1762788109971-29b299b2b4ef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxjb25jZXJ0JTIwY3Jvd2QlMjBsaWdodHMlMjBhdG1vc3BoZXJlfGVufDB8fHx8MTc3MDI0ODM2Nnww&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'featured-3',
      title: 'Latin Pop Experience',
      date: '05 JUL',
      venue: 'Auditorio Nacional, CDMX',
      category: 'Pop Latino',
      price: '750',
      image: 'https://images.unsplash.com/photo-1719650932798-bda508a2b209?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGZlc3RpdmFsJTIwc3RhZ2UlMjBwZXJmb3JtYW5jZXxlbnwwfHx8fDE3NzAyNDgzNjd8MA&ixlib=rb-4.1.0&q=85'
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Star className="text-[#FF9500]" size={28} fill="#FF9500" />
            <h2 
              className="text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Eventos Destacados
            </h2>
          </div>
          <button 
            className="hidden md:block text-[#007AFF] hover:text-[#0056b3] font-semibold transition-colors duration-200"
            data-testid="view-all-featured-button"
          >
            Ver todos →
          </button>
        </div>

        {/* Featured Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} featured={true} />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="md:hidden mt-6 text-center">
          <button 
            className="text-[#007AFF] hover:text-[#0056b3] font-semibold transition-colors duration-200"
            data-testid="mobile-view-all-featured-button"
          >
            Ver todos los eventos destacados →
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
