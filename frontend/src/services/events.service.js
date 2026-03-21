import api from "../api/api";

// ---------- Helpers ----------
function safeString(v, fallback = "") {
  return typeof v === "string" && v.trim().length ? v : fallback;
}

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Formato simple tipo "15 JUN 2025"
function formatDateShort(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const months = [
    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
  ];
  const mon = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${mon} ${year}`;
}

function formatTimeHHMM(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function unwrapData(payload) {
  if (payload == null) return payload;
  if (typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}

function normalizeEventFromApi(evt) {
  if (!evt) return null;

  const firstFn =
    Array.isArray(evt.functions) && evt.functions.length ? evt.functions[0] : null;

  const normalizedFunctions = (evt.functions || []).map((fn) => ({
    id: fn.id,
    date: formatDateShort(fn.date),
    time: formatTimeHHMM(fn.date),
    venueName: safeString(fn.venueName),
    city: safeString(fn.city),
    country: safeString(fn.country),
    seatmapKey: safeString(fn.seatmapKey),
    taxRate: safeNumber(fn.taxRate, 0),
    availability: "Disponible",
    _raw: fn,
  }));

  const normalizedTicketTypes = (evt.ticketTypes || []).map((tt) => ({
    id: tt.id,
    name: safeString(tt.name, "General"),
    price: safeNumber(tt.price, 0),
    available: safeNumber(tt.available, 0),
    serviceFee: safeNumber(tt.serviceFee, 0),
    eventId: tt.eventId,
    _raw: tt,
  }));

  const computedStartingPrice =
    safeNumber(evt.startingPrice, 0) ||
    (normalizedTicketTypes.length
      ? Math.min(...normalizedTicketTypes.map((t) => safeNumber(t.price, 0)))
      : 0);

  return {
    id: evt.id,
    title: safeString(evt.title, "Evento"),
    description: safeString(evt.description, ""),

    image:
      safeString(evt.imageUrl) ||
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200",
    imageUrl: safeString(evt.imageUrl),

    youtubeUrl: safeString(evt.youtubeUrl, ""),
    useExternalTicket: Boolean(evt.useExternalTicket),
    externalTicketUrl: safeString(evt.externalTicketUrl, ""),

    saleType: safeString(evt.saleType, "GENERAL").toLowerCase(),

    date: firstFn ? formatDateShort(firstFn.date) : "",
    time: firstFn ? formatTimeHHMM(firstFn.date) : "",
    venue: firstFn ? safeString(firstFn.venueName) : "",
    location: safeString(evt.location, ""),
    city: firstFn ? safeString(firstFn.city) : "",
    country: firstFn ? safeString(firstFn.country, "México") : "México",

    startingPrice: computedStartingPrice,

    ageLimit: safeString(evt.ageLimit, "Todas las edades"),
    doors: safeString(evt.doors, "17:00"),
    duration: safeString(evt.duration, "2 horas"),

    producerEmail: safeString(evt.producerEmail, ""),
    producerPhone: safeString(evt.producerPhone, ""),
    producerContact: evt.producerEmail
      ? { email: evt.producerEmail, phone: evt.producerPhone || "" }
      : null,

    isFeatured: Boolean(evt.isFeatured),
    featuredOrder:
      evt.featuredOrder === null || evt.featuredOrder === undefined
        ? null
        : Number(evt.featuredOrder),

    functions: normalizedFunctions,
    ticketTypes: normalizedTicketTypes,

    _raw: evt,
  };
}

// ---------- API ----------
export async function fetchEvents() {
  const res = await api.get("/events");
  const raw = unwrapData(res.data);

  const list = Array.isArray(raw) ? raw : [];
  return list.map(normalizeEventFromApi).filter(Boolean);
}

export async function fetchEventById(id) {
  const res = await api.get(`/events/${id}`);
  const raw = unwrapData(res.data);

  return normalizeEventFromApi(raw);
}