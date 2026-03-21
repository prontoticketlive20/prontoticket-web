import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import api from '../api/api';

// Storage keys
const PURCHASE_STATE_KEY = 'prontoticket_purchase_state';
const SEATSIO_SESSION_STORAGE_KEY = 'prontoticket_seatsio_session';
const GENERAL_PURCHASE_TIMER_KEY = 'prontoticket_general_purchase_timer';

// Valid sale types
const VALID_SALE_TYPES = ['seated', 'general'];
const GENERAL_PURCHASE_DURATION_SECONDS = 10 * 60;
const TIMER_WARNING_THRESHOLD_SECONDS = 60;

// Currency configuration by country
const CURRENCY_BY_COUNTRY = {
  'México': { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
  'Estados Unidos': { code: 'USD', symbol: '$', name: 'Dólar Estadounidense' },
  'España': { code: 'EUR', symbol: '€', name: 'Euro' },
  'Argentina': { code: 'ARS', symbol: '$', name: 'Peso Argentino' },
  'Colombia': { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  'Chile': { code: 'CLP', symbol: '$', name: 'Peso Chileno' },
  'Perú': { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' }
};

const getStoredState = () => {
  try {
    const stored = sessionStorage.getItem(PURCHASE_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return {
          eventId: parsed.eventId || null,
          selectedFunction: parsed.selectedFunction || null,
          selectedTickets: Array.isArray(parsed.selectedTickets) ? parsed.selectedTickets : [],
          selectedSeats: Array.isArray(parsed.selectedSeats) ? parsed.selectedSeats : [],
          timestamp: parsed.timestamp || null
        };
      }
    }
  } catch (e) {
    console.warn('[ProntoTicketLive] Failed to parse stored purchase state:', e);
  }
  return null;
};

const saveState = (state) => {
  try {
    const toStore = {
      eventId: state.eventId,
      selectedFunction: state.selectedFunction,
      selectedTickets: state.selectedTickets,
      selectedSeats: state.selectedSeats,
      timestamp: Date.now()
    };
    sessionStorage.setItem(PURCHASE_STATE_KEY, JSON.stringify(toStore));
  } catch (e) {
    console.warn('[ProntoTicketLive] Failed to save purchase state:', e);
  }
};

const clearStoredState = () => {
  try {
    sessionStorage.removeItem(PURCHASE_STATE_KEY);
  } catch (e) {
    console.warn('[ProntoTicketLive] Failed to clear purchase state:', e);
  }
};

const getStoredSeatsioSession = () => {
  try {
    const raw = sessionStorage.getItem(SEATSIO_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearStoredSeatsioSession = () => {
  try {
    sessionStorage.removeItem(SEATSIO_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const getStoredGeneralTimer = () => {
  try {
    const raw = sessionStorage.getItem(GENERAL_PURCHASE_TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveGeneralTimer = (data) => {
  try {
    sessionStorage.setItem(GENERAL_PURCHASE_TIMER_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const clearGeneralTimer = () => {
  try {
    sessionStorage.removeItem(GENERAL_PURCHASE_TIMER_KEY);
  } catch {
    // ignore
  }
};

const PurchaseContext = createContext(null);

const normalizeEventFromApi = (evt) => {
  if (!evt) return null;

  const saleTypeRaw = evt.saleType || 'GENERAL';
  const saleType = String(saleTypeRaw).toLowerCase();

  const functions = Array.isArray(evt.functions)
    ? evt.functions.map((func) => ({
        ...func,
        taxRate: Number(func?.taxRate || 0),
      }))
    : [];

  const firstFunction = functions.length > 0 ? functions[0] : null;

  return {
    ...evt,
    saleType,
    image: evt.imageUrl || evt.image || '',
    imageUrl: evt.imageUrl || evt.image || '',
    youtubeUrl: evt.youtubeUrl || '',
    useExternalTicket: Boolean(evt.useExternalTicket),
    externalTicketUrl: evt.externalTicketUrl || '',
    venue: firstFunction?.venueName || evt.venueName || evt.venue || 'Venue',
    city: firstFunction?.city || evt.city || 'Ciudad',
    country: firstFunction?.country || evt.country || 'Estados Unidos',
    location:
      evt.location ||
      [
        firstFunction?.venueName || evt.venueName || evt.venue || '',
        firstFunction?.city || evt.city || '',
        firstFunction?.country || evt.country || ''
      ]
        .filter(Boolean)
        .join(', '),
    date: firstFunction?.date
      ? new Date(firstFunction.date).toLocaleDateString()
      : evt.date || '',
    time: firstFunction?.date
      ? new Date(firstFunction.date).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : evt.time || '',
    producerContact:
      evt.producerEmail || evt.producerPhone
        ? {
            email: evt.producerEmail || '',
            phone: evt.producerPhone || '',
          }
        : null,
    functions,
    ticketTypes: Array.isArray(evt.ticketTypes) ? evt.ticketTypes : [],
  };
};

export const PurchaseProvider = ({ children }) => {
  const storedState = getStoredState();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFunction, setSelectedFunction] = useState(storedState?.selectedFunction || null);
  const [selectedTickets, setSelectedTickets] = useState(storedState?.selectedTickets || []);
  const [selectedSeats, setSelectedSeats] = useState(storedState?.selectedSeats || []);
  const [storedEventId] = useState(storedState?.eventId || null);

  const [purchaseTimer, setPurchaseTimer] = useState({
    isActive: false,
    isExpired: false,
    isWarning: false,
    timeRemaining: 0,
    mode: null,
    source: null,
  });

  const fetchEventById = useCallback(async (eventId) => {
    if (!eventId) return null;

    try {
      const res = await api.get(`/events/${eventId}`);
      return normalizeEventFromApi(res.data?.data || res.data);
    } catch (e) {
      try {
        const res2 = await api.get('/events');
        const list = res2.data?.data || res2.data || [];
        const found = Array.isArray(list) ? list.find((x) => x.id === eventId) : null;
        return normalizeEventFromApi(found);
      } catch (e2) {
        console.error('[PurchaseContext] Error cargando evento desde backend:', e2);
        return null;
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      if (!storedEventId) return;
      if (selectedEvent?.id) return;
      const evt = await fetchEventById(storedEventId);
      if (mounted && evt) {
        setSelectedEvent(evt);
      }
    };

    restore();

    return () => {
      mounted = false;
    };
  }, [storedEventId, fetchEventById, selectedEvent?.id]);

  useEffect(() => {
    if (selectedEvent?.id) {
      saveState({
        eventId: selectedEvent.id,
        selectedFunction,
        selectedTickets,
        selectedSeats
      });
    }
  }, [selectedEvent, selectedFunction, selectedTickets, selectedSeats]);

  const isValidSaleType = useCallback((saleType) => {
    return VALID_SALE_TYPES.includes(saleType);
  }, []);

  const selectEvent = useCallback((event) => {
    const normalized = normalizeEventFromApi(event);

    if (normalized && !isValidSaleType(normalized.saleType)) {
      console.error(
        `[ProntoTicketLive Context] Invalid saleType for event "${normalized.title}".`,
        `\nReceived: "${normalized.saleType}"`,
        `\nExpected: "seated" | "general"`
      );
    }

    setSelectedEvent((prevEvent) => {
      const isSameEvent = prevEvent?.id === normalized?.id;
      const isRestoringFromStorage = !prevEvent && storedEventId === normalized?.id;

      if (!isSameEvent && !isRestoringFromStorage) {
        setSelectedFunction(null);
        setSelectedTickets([]);
        setSelectedSeats([]);

        clearGeneralTimer();
        clearStoredSeatsioSession();

        if (normalized?.id) {
          saveState({
            eventId: normalized.id,
            selectedFunction: null,
            selectedTickets: [],
            selectedSeats: []
          });
        }
      }

      return normalized;
    });
  }, [isValidSaleType, storedEventId]);

  const selectEventById = useCallback(async (eventId) => {
    const evt = await fetchEventById(eventId);
    if (evt) selectEvent(evt);
    return evt;
  }, [fetchEventById, selectEvent]);

  const selectFunction = useCallback((func) => {
    setSelectedFunction(func ? { ...func, taxRate: Number(func?.taxRate || 0) } : null);
  }, []);

  const updateTickets = useCallback((tickets) => {
    setSelectedTickets(tickets);
  }, []);

  const updateSeats = useCallback((seats) => {
    setSelectedSeats(seats);
  }, []);

  const addSeat = useCallback((seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => String(s.id) === String(seat.id));
      if (exists) return prev;
      return [...prev, seat];
    });
  }, []);

  const removeSeat = useCallback((seatId) => {
    setSelectedSeats((prev) => prev.filter((s) => String(s.id) !== String(seatId)));
  }, []);

  const clearPurchase = useCallback(() => {
    setSelectedEvent(null);
    setSelectedFunction(null);
    setSelectedTickets([]);
    setSelectedSeats([]);
    clearStoredState();
    clearStoredSeatsioSession();
    clearGeneralTimer();
    setPurchaseTimer({
      isActive: false,
      isExpired: false,
      isWarning: false,
      timeRemaining: 0,
      mode: null,
      source: null,
    });
  }, []);

  const expirePurchase = useCallback(() => {
    setSelectedFunction(null);
    setSelectedTickets([]);
    setSelectedSeats([]);
    clearStoredState();
    clearStoredSeatsioSession();
    clearGeneralTimer();
    setPurchaseTimer({
      isActive: false,
      isExpired: true,
      isWarning: false,
      timeRemaining: 0,
      mode: null,
      source: null,
    });
  }, []);

  const getCurrency = useCallback(() => {
    if (!selectedEvent?.country) {
      return CURRENCY_BY_COUNTRY['Estados Unidos'];
    }
    return CURRENCY_BY_COUNTRY[selectedEvent.country] || CURRENCY_BY_COUNTRY['Estados Unidos'];
  }, [selectedEvent]);

  const getTaxRate = useCallback(() => {
    return Number(selectedFunction?.taxRate || 0);
  }, [selectedFunction]);

  const getTicketsSubtotal = useCallback(() => {
    return selectedTickets.reduce((sum, ticket) => {
      return sum + (Number(ticket.price || 0) * Number(ticket.quantity || 0));
    }, 0);
  }, [selectedTickets]);

  const getSeatsSubtotal = useCallback(() => {
    return selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
  }, [selectedSeats]);

  const getSubtotal = useCallback(() => {
    if (selectedEvent?.saleType === 'seated') {
      return getSeatsSubtotal();
    }
    return getTicketsSubtotal();
  }, [selectedEvent, getTicketsSubtotal, getSeatsSubtotal]);

  const getServiceFee = useCallback(() => {
    if (selectedEvent?.saleType === 'seated') {
      return selectedSeats.reduce((sum, seat) => {
        return sum + Number(seat.serviceFee || 0);
      }, 0);
    }

    return selectedTickets.reduce((sum, ticket) => {
      const fee = Number(ticket.serviceFee || 0);
      const qty = Number(ticket.quantity || 0);
      return sum + (fee * qty);
    }, 0);
  }, [selectedEvent, selectedSeats, selectedTickets]);

  const getTax = useCallback(() => {
    const subtotal = getSubtotal();
    const taxRate = getTaxRate();
    return Number((subtotal * taxRate).toFixed(2));
  }, [getSubtotal, getTaxRate]);

  const getTotal = useCallback(() => {
    const subtotal = getSubtotal();
    const tax = getTax();
    const fee = getServiceFee();
    return Number((subtotal + fee + tax).toFixed(2));
  }, [getSubtotal, getTax, getServiceFee]);

  const formatPrice = useCallback((amount) => {
    const currency = getCurrency();
    return `${currency.symbol}${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [getCurrency]);

  const isPurchaseReady = useCallback(() => {
    if (selectedEvent?.saleType === 'seated') {
      return selectedSeats.length > 0;
    }
    return selectedTickets.some((t) => Number(t.quantity || 0) > 0);
  }, [selectedEvent, selectedSeats, selectedTickets]);

  const getStoredEventId = useCallback(() => {
    return storedEventId;
  }, [storedEventId]);

  const formatTimer = useCallback((seconds) => {
    const safeSeconds = Math.max(0, Number(seconds || 0));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const hasGeneralSelections =
      selectedTickets && selectedTickets.some((t) => Number(t.quantity || 0) > 0);

    if (selectedEvent?.saleType === 'general' && hasGeneralSelections) {
      const stored = getStoredGeneralTimer();

      if (!stored?.expiresAt || stored?.eventId !== selectedEvent?.id) {
        saveGeneralTimer({
          eventId: selectedEvent?.id,
          expiresAt: Date.now() + GENERAL_PURCHASE_DURATION_SECONDS * 1000,
        });
      }
    } else {
      clearGeneralTimer();
    }
  }, [selectedEvent?.saleType, selectedEvent?.id, selectedTickets]);

  useEffect(() => {
    const tick = () => {
      const hasSeatSelections = selectedSeats.length > 0;
      const hasTicketSelections = selectedTickets.some((t) => Number(t.quantity || 0) > 0);

      if (selectedEvent?.saleType === 'seated' && hasSeatSelections) {
        const seatsioSession = getStoredSeatsioSession();

        if (!seatsioSession?.expiresAt) {
          setPurchaseTimer({
            isActive: false,
            isExpired: false,
            isWarning: false,
            timeRemaining: 0,
            mode: 'seated',
            source: 'seatsio',
          });
          return;
        }

        const remaining = Math.max(
          0,
          Math.floor((new Date(seatsioSession.expiresAt).getTime() - Date.now()) / 1000)
        );

        setPurchaseTimer({
          isActive: remaining > 0,
          isExpired: remaining <= 0,
          isWarning: remaining > 0 && remaining <= TIMER_WARNING_THRESHOLD_SECONDS,
          timeRemaining: remaining,
          mode: 'seated',
          source: 'seatsio',
        });

        return;
      }

      if (selectedEvent?.saleType === 'general' && hasTicketSelections) {
        const generalTimer = getStoredGeneralTimer();

        if (!generalTimer?.expiresAt) {
          setPurchaseTimer({
            isActive: false,
            isExpired: false,
            isWarning: false,
            timeRemaining: 0,
            mode: 'general',
            source: 'app',
          });
          return;
        }

        const remaining = Math.max(
          0,
          Math.floor((Number(generalTimer.expiresAt) - Date.now()) / 1000)
        );

        setPurchaseTimer({
          isActive: remaining > 0,
          isExpired: remaining <= 0,
          isWarning: remaining > 0 && remaining <= TIMER_WARNING_THRESHOLD_SECONDS,
          timeRemaining: remaining,
          mode: 'general',
          source: 'app',
        });

        return;
      }

      setPurchaseTimer({
        isActive: false,
        isExpired: false,
        isWarning: false,
        timeRemaining: 0,
        mode: selectedEvent?.saleType || null,
        source: null,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [selectedEvent?.saleType, selectedSeats, selectedTickets]);

  const getPurchaseSummary = useCallback(() => {
    const currency = getCurrency();
    const taxRate = getTaxRate();
    const subtotal = getSubtotal();
    const tax = getTax();
    const total = getTotal();
    const serviceFee = subtotal > 0 ? getServiceFee() : 0;

    return {
      event: selectedEvent,
      eventId: selectedEvent?.id || storedEventId,
      selectedFunction,
      tickets: selectedTickets,
      seats: selectedSeats,
      isSeatedEvent: selectedEvent?.saleType === 'seated',
      currency,
      taxRate,
      subtotal,
      serviceFee,
      tax,
      total,
      isPurchaseReady: isPurchaseReady()
    };
  }, [
    selectedEvent,
    storedEventId,
    selectedFunction,
    selectedTickets,
    selectedSeats,
    getCurrency,
    getTaxRate,
    getSubtotal,
    getTax,
    getTotal,
    getServiceFee,
    isPurchaseReady
  ]);

  const timerLabel = useMemo(() => formatTimer(purchaseTimer.timeRemaining), [
    purchaseTimer.timeRemaining,
    formatTimer
  ]);

  const value = {
    selectedEvent,
    selectedFunction,
    selectedTickets,
    selectedSeats,
    purchaseTimer,
    timerLabel,

    selectEvent,
    selectEventById,
    selectFunction,
    updateTickets,
    updateSeats,
    addSeat,
    removeSeat,
    clearPurchase,
    expirePurchase,

    getCurrency,
    getTaxRate,
    getSubtotal,
    getServiceFee,
    getTax,
    getTotal,
    formatPrice,
    formatTimer,
    isPurchaseReady,
    getPurchaseSummary,
    getStoredEventId
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
};

export const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
};

export default PurchaseContext;