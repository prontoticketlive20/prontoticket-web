import React, { useEffect, useMemo, useState } from "react";
import EventCard from "./EventCard";
import { Star } from "lucide-react";
import api from "../api/api";

const formatEventForCard = (event) => {
  const firstFn = Array.isArray(event?.functions) ? event.functions[0] : null;
  const firstDate = firstFn?.date ? new Date(firstFn.date) : null;
  const hasValidDate = firstDate && !Number.isNaN(firstDate.getTime());

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description || "",
    category: event.category,
    saleType: event.saleType,
    image: event.imageUrl || "",
    imageUrl: event.imageUrl || "",
    location: event.location || firstFn?.venueName || "",
    venue: firstFn?.venueName || "",
    city: firstFn?.city || "",
    country: firstFn?.country || "",
    date: hasValidDate
      ? firstDate.toLocaleDateString()
      : "",
    time: hasValidDate
      ? firstDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    isFeatured: event.isFeatured === true,
    featuredOrder: event.featuredOrder ?? null,
    useExternalTicket: Boolean(event.useExternalTicket),
    externalTicketUrl: event.externalTicketUrl || "",
    startingPrice: Number(event.startingPrice || 0),
    functions: Array.isArray(event?.functions) ? event.functions : [],
    _raw: {
      ...event,
      functions: Array.isArray(event?.functions) ? event.functions : [],
    },
  };
};

const FeaturedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await api.get("/events/public/featured");
        const raw = res.data?.data ?? res.data ?? [];
        const rows = Array.isArray(raw) ? raw : [];
        if (mounted) {
          setEvents(rows.map(formatEventForCard));
        }
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
    return [...events]
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