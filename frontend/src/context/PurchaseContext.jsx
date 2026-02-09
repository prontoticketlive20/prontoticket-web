import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Storage key for sessionStorage
const PURCHASE_STATE_KEY = 'prontoticket_purchase_state';

// Valid sale types - only these are allowed
const VALID_SALE_TYPES = ['seated', 'general'];

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

// Tax rates by country
const TAX_RATES = {
  'México': 0.16,
  'Estados Unidos': 0.08,
  'España': 0.21,
  'Argentina': 0.21,
  'Colombia': 0.19,
  'Chile': 0.19,
  'Perú': 0.18
};

// Helper to safely get from sessionStorage
const getStoredState = () => {
  try {
    const stored = sessionStorage.getItem(PURCHASE_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate stored data has expected structure
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

// Helper to save to sessionStorage
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

// Helper to clear sessionStorage
const clearStoredState = () => {
  try {
    sessionStorage.removeItem(PURCHASE_STATE_KEY);
  } catch (e) {
    console.warn('[ProntoTicketLive] Failed to clear purchase state:', e);
  }
};

const PurchaseContext = createContext(null);

export const PurchaseProvider = ({ children }) => {
  // Initialize state from sessionStorage if available
  const storedState = getStoredState();
  
  // Selected event data (full event object, not persisted - loaded from mockEvents)
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Selected function (for multi-function events) - persisted
  const [selectedFunction, setSelectedFunction] = useState(storedState?.selectedFunction || null);
  
  // Selected tickets array - persisted
  const [selectedTickets, setSelectedTickets] = useState(storedState?.selectedTickets || []);
  
  // Selected seats array - persisted
  const [selectedSeats, setSelectedSeats] = useState(storedState?.selectedSeats || []);
  
  // Stored event ID for restoration
  const [storedEventId] = useState(storedState?.eventId || null);
  
  // Service fee
  const [serviceFee] = useState(150);

  // Persist state to sessionStorage whenever it changes
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

  // Validate saleType helper
  const isValidSaleType = useCallback((saleType) => {
    return VALID_SALE_TYPES.includes(saleType);
  }, []);

  // Set the current event with validation
  // Restore persisted selections if returning to the same event
  const selectEvent = useCallback((event) => {
    if (event && !isValidSaleType(event.saleType)) {
      console.error(
        `[ProntoTicketLive Context] Invalid saleType for event "${event.title}".`,
        `\nReceived: "${event.saleType}"`,
        `\nExpected: "seated" | "general"`
      );
    }
    
    setSelectedEvent(prevEvent => {
      const isSameEvent = prevEvent?.id === event?.id;
      const isRestoringFromStorage = !prevEvent && storedEventId === event?.id;
      
      // Only reset selections if switching to a DIFFERENT event
      // AND not restoring from storage
      if (!isSameEvent && !isRestoringFromStorage) {
        setSelectedFunction(null);
        setSelectedTickets([]);
        setSelectedSeats([]);
        // Clear storage when switching events
        if (event?.id) {
          saveState({
            eventId: event.id,
            selectedFunction: null,
            selectedTickets: [],
            selectedSeats: []
          });
        }
      }
      
      return event;
    });
  }, [isValidSaleType, storedEventId]);

  // Set the selected function
  const selectFunction = useCallback((func) => {
    setSelectedFunction(func);
  }, []);

  // Update tickets selection (for general events only)
  const updateTickets = useCallback((tickets) => {
    setSelectedTickets(tickets);
  }, []);

  // Update seats selection (for seated events only)
  const updateSeats = useCallback((seats) => {
    setSelectedSeats(seats);
  }, []);

  // Add a single seat (for seated events)
  const addSeat = useCallback((seat) => {
    setSelectedSeats(prev => [...prev, seat]);
  }, []);

  // Remove a seat by id (for seated events)
  const removeSeat = useCallback((seatId) => {
    setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
  }, []);

  // Clear all selections and storage
  const clearPurchase = useCallback(() => {
    setSelectedEvent(null);
    setSelectedFunction(null);
    setSelectedTickets([]);
    setSelectedSeats([]);
    clearStoredState();
  }, []);

  // Get currency based on event country
  const getCurrency = useCallback(() => {
    if (!selectedEvent?.country) {
      return CURRENCY_BY_COUNTRY['México'];
    }
    return CURRENCY_BY_COUNTRY[selectedEvent.country] || CURRENCY_BY_COUNTRY['México'];
  }, [selectedEvent]);

  // Get tax rate based on event country
  const getTaxRate = useCallback(() => {
    if (!selectedEvent?.country) {
      return TAX_RATES['México'];
    }
    return TAX_RATES[selectedEvent.country] || TAX_RATES['México'];
  }, [selectedEvent]);

  // Calculate subtotal from tickets (general events)
  const getTicketsSubtotal = useCallback(() => {
    return selectedTickets.reduce((sum, ticket) => {
      return sum + (ticket.price * ticket.quantity);
    }, 0);
  }, [selectedTickets]);

  // Calculate subtotal from seats (seated events)
  const getSeatsSubtotal = useCallback(() => {
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  }, [selectedSeats]);

  // Get total subtotal based on saleType
  const getSubtotal = useCallback(() => {
    if (selectedEvent?.saleType === 'seated') {
      return getSeatsSubtotal();
    }
    return getTicketsSubtotal();
  }, [selectedEvent, getTicketsSubtotal, getSeatsSubtotal]);

  // Calculate tax
  const getTax = useCallback(() => {
    const subtotal = getSubtotal();
    const taxRate = getTaxRate();
    return Math.round(subtotal * taxRate);
  }, [getSubtotal, getTaxRate]);

  // Calculate total
  const getTotal = useCallback(() => {
    const subtotal = getSubtotal();
    const tax = getTax();
    const hasItems = subtotal > 0;
    return subtotal + (hasItems ? serviceFee : 0) + tax;
  }, [getSubtotal, getTax, serviceFee]);

  // Format price with currency
  const formatPrice = useCallback((amount) => {
    const currency = getCurrency();
    return `${currency.symbol}${amount.toLocaleString()}`;
  }, [getCurrency]);

  // Check if purchase is ready (has selections based on saleType)
  const isPurchaseReady = useCallback(() => {
    if (selectedEvent?.saleType === 'seated') {
      return selectedSeats.length > 0;
    }
    return selectedTickets.some(t => t.quantity > 0);
  }, [selectedEvent, selectedSeats, selectedTickets]);

  // Get stored event ID (for restoration on page load)
  const getStoredEventId = useCallback(() => {
    return storedEventId;
  }, [storedEventId]);

  // Get purchase summary data
  const getPurchaseSummary = useCallback(() => {
    const currency = getCurrency();
    const taxRate = getTaxRate();
    const subtotal = getSubtotal();
    const tax = getTax();
    const total = getTotal();
    const hasItems = subtotal > 0;

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
      serviceFee: hasItems ? serviceFee : 0,
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
    serviceFee,
    isPurchaseReady
  ]);

  const value = {
    // State
    selectedEvent,
    selectedFunction,
    selectedTickets,
    selectedSeats,
    serviceFee,
    
    // Actions
    selectEvent,
    selectFunction,
    updateTickets,
    updateSeats,
    addSeat,
    removeSeat,
    clearPurchase,
    
    // Computed
    getCurrency,
    getTaxRate,
    getSubtotal,
    getTax,
    getTotal,
    formatPrice,
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

// Custom hook to use purchase context
export const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
};

export default PurchaseContext;
