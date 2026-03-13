import React, { useEffect, useMemo, useState } from "react";
import EventCard from "./EventCard";
import { Star } from "lucide-react";
import { fetchEvents } from "../services/events.service";

const FeaturedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await fetchEvents();
        if (mounted) setEvents(data);
      } catch (e) {
        console.error("[FeaturedEvents] Error cargando eventos:", e);
        if (mounted) setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredEvents = useMemo(() => {
    return events
      .filter((event) => event.isFeatured === true)
      .sort((a, b) => {
        const orderA = Number(a.featuredOrder || 999);
        const orderB = Number(b.featuredOrder || 999);
        return orderA - orderB;
      })
      .slice(0, 3);
  }, [events]);

  return (
    <section className="py-12 md:py-16 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-4">
            <Star
              className="text-[#FF9500]"
              size={28}
              fill="#FF9500"
              strokeWidth={2}
            />
            <h2
              className="text-3xl md:text-4xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Eventos Destacados
            </h2>
          </div>

          <button
            className="hidden md:flex items-center space-x-2 text-[#007AFF] hover:text-[#0056b3] text-sm font-semibold transition-colors duration-200 tracking-wide"
            data-testid="view-all-featured-button"
          >
            <span>Ver todos</span>
            <span>→</span>
          </button>
        </div>

        {loading && (
          <div className="text-white/60">Cargando eventos destacados...</div>
        )}

        {!loading && featuredEvents.length === 0 && (
          <div className="text-white/60">
            No hay eventos destacados configurados todavía.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} featured={true} />
          ))}
        </div>

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