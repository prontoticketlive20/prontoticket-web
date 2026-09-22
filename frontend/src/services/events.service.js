import api from "../api/api";

const DEFAULT_TIME_ZONE = "America/New_York";

// ---------- Helpers ----------
function safeString(v, fallback = "") {
  return typeof v === "string" && v.trim().length ? v : fallback;
}

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getTimeZone(timeZone) {
  return safeString(timeZone, DEFAULT_TIME_ZONE);
}

// Formato tipo "15 JUN 2025" respetando el huso horario de la función
function formatDateShort(dateValue, timeZone = DEFAULT_TIME_ZONE) {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";

  try {
    const parts = new Intl.DateTimeFormat("es-US", {
      timeZone: getTimeZone(timeZone),
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).formatToParts(d);

    const day =
      parts.find((part) => part.type === "day")?.value || "";

    const month =
      parts.find((part) => part.type === "month")?.value || "";

    const year =
      parts.find((part) => part.type === "year")?.value || "";

    return `${day} ${month.replace(".", "").toUpperCase()} ${year}`;
  } catch (error) {
    console.error("Error formatting event date:", error);
    return "";
  }
}

// Formato 24 horas tipo "21:00" respetando el huso horario de la función
function formatTimeHHMM(dateValue, timeZone = DEFAULT_TIME_ZONE) {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";

  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: getTimeZone(timeZone),
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);

    const hour =
      parts.find((part) => part.type === "hour")?.value || "";

    const minute =
      parts.find((part) => part.type === "minute")?.value || "";

    return `${hour}:${minute}`;
  } catch (error) {
    console.error("Error formatting event time:", error);
    return "";
  }
}

function unwrapData(payload) {
  if (payload == null) return payload;
  if (typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}

function normalizeEventFromApi(evt) {
  if (!evt) return null;

  const firstFn =
    Array.isArray(evt.functions) && evt.functions.length
      ? evt.functions[0]
      : null;

  const normalizedFunctions = (evt.functions || []).map((fn) => {
    const timeZone = getTimeZone(fn.timeZone);

    return {
      id: fn.id,
      date: formatDateShort(fn.date, timeZone),
      time: formatTimeHHMM(fn.date, timeZone),
      timeZone,
      venueName: safeString(fn.venueName),
      city: safeString(fn.city),
      country: safeString(fn.country),
      currency: safeString(fn.currency, "USD"),
      seatmapKey: safeString(fn.seatmapKey),
      taxRate: safeNumber(fn.taxRate, 0),
      availability: "Disponible",
      _raw: fn,
    };
  });

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
      ? Math.min(
          ...normalizedTicketTypes.map((t) =>
            safeNumber(t.price, 0)
          )
        )
      : 0);

  const firstFnTimeZone = firstFn
    ? getTimeZone(firstFn.timeZone)
    : DEFAULT_TIME_ZONE;

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

    date: firstFn
      ? formatDateShort(firstFn.date, firstFnTimeZone)
      : "",
    time: firstFn
      ? formatTimeHHMM(firstFn.date, firstFnTimeZone)
      : "",
    timeZone: firstFnTimeZone,
    venue: firstFn ? safeString(firstFn.venueName) : "",
    location: safeString(evt.location, ""),
    city: firstFn ? safeString(firstFn.city) : "",
    country: firstFn
      ? safeString(firstFn.country, "México")
      : "México",

    startingPrice: computedStartingPrice,

    ageLimit: safeString(evt.ageLimit, "Todas las edades"),
    doors: safeString(evt.doors, "17:00"),
    duration: safeString(evt.duration, "2 horas"),

    producerEmail: safeString(evt.producerEmail, ""),
    producerPhone: safeString(evt.producerPhone, ""),
    producerContact: evt.producerEmail
      ? {
          email: evt.producerEmail,
          phone: evt.producerPhone || "",
        }
      : null,

    isFeatured: Boolean(evt.isFeatured),
    featuredOrder:
      evt.featuredOrder === null ||
      evt.featuredOrder === undefined
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

export async function fetchEventById(param) {
  try {
    // 🔥 dejar que el backend resuelva slug o id
    const res = await api.get(`/events/${param}`);
    const raw = unwrapData(res.data);

    return normalizeEventFromApi(raw);
  } catch (error) {
    console.error("❌ Error fetchEventById:", error);
    return null;
  }
}