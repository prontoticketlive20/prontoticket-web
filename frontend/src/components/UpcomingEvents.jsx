import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EventCard from "./EventCard";
import { Clock } from "lucide-react";
import api from "../api/api";

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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

const UpcomingEvents = () => {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await api.get("/events/public/catalog");
        const raw = res.data?.data ?? res.data ?? [];
        const rows = Array.isArray(raw) ? raw : [];
        if (mounted) setEvents(rows.map(formatEventForCard));
      } catch (e) {
        console.error("[UpcomingEvents] Error cargando eventos:", e);
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

  const filters = useMemo(() => {
    const params = new URLSearchParams(location.search);

    return {
      q: normalizeText(params.get("q") || ""),
      country: normalizeText(params.get("country") || ""),
      city: normalizeText(params.get("city") || ""),
      venueDate: normalizeText(params.get("venueDate") || ""),
    };
  }, [location.search]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.q || filters.country || filters.city || filters.venueDate
    );
  }, [filters]);

  const upcomingEvents = useMemo(() => {
    const parseEventDate = (event) => {
      const firstRawDate = event?._raw?.functions?.[0]?.date;
      if (!firstRawDate) return Number.MAX_SAFE_INTEGER;

      const d = new Date(firstRawDate);
      return Number.isNaN(d.getTime()) ? Number.MAX_SAFE_INTEGER : d.getTime();
    };

    const formatSearchableDate = (event) => {
      const raw = event?._raw?.functions?.[0]?.date;
      if (!raw) return "";
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return "";

      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());

      return normalizeText(`${dd}/${mm}/${yyyy} ${dd}-${mm}-${yyyy} ${yyyy}`);
    };

    const filtered = events
      .filter((event) => event.isFeatured !== true)
      .filter((event) => {
        const title = normalizeText(event.title);
        const country = normalizeText(event.country);
        const city = normalizeText(event.city);
        const venue = normalizeText(event.venue);
        const locationText = normalizeText(event.location);
        const visibleDate = normalizeText(event.date);
        const searchableDate = formatSearchableDate(event);

        const matchQ = !filters.q || title.includes(filters.q);
        const matchCountry =
          !filters.country || country.includes(filters.country);
        const matchCity = !filters.city || city.includes(filters.city);
        const matchVenueDate =
          !filters.venueDate ||
          venue.includes(filters.venueDate) ||
          locationText.includes(filters.venueDate) ||
          visibleDate.includes(filters.venueDate) ||
          searchableDate.includes(filters.venueDate);

        return matchQ && matchCountry && matchCity && matchVenueDate;
      })
      .sort((a, b) => parseEventDate(a) - parseEventDate(b));

    return hasActiveFilters ? filtered : filtered.slice(0, 8);
  }, [events, filters, hasActiveFilters]);

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-[#0A0A0A] to-[#121212]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-4">
            <Clock className="text-[#007AFF]" size={28} strokeWidth={2} />
            <h2
              className="text-3xl md:text-4xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {hasActiveFilters ? "Resultados de búsqueda" : "Próximos Eventos"}
            </h2>
          </div>
        </div>

        {loading && (
          <div className="text-white/60">Cargando próximos eventos...</div>
        )}

        {!loading && upcomingEvents.length === 0 && (
          <div className="text-white/60">
            {hasActiveFilters
              ? "No encontramos eventos con esos criterios de búsqueda."
              : "No hay próximos eventos todavía."}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {!hasActiveFilters && upcomingEvents.length > 0 && (
          <div className="text-center mt-8">
            <button
              className="px-8 py-3 bg-white/10 text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/20 border border-white/10 hover:border-white/30 active:scale-95"
              data-testid="load-more-events-button"
            >
              Cargar Más Eventos
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingEvents;