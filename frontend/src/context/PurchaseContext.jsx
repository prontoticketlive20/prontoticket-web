import React, { createContext, useContext, useState, useCallback } from 'react';

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

const PurchaseContext = createContext(null);

export const PurchaseProvider = ({ children }) => {
  // Selected event data
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Selected function (for multi-function events)
  const [selectedFunction, setSelectedFunction] = useState(null);
  
  // Selected tickets array: [{ id, type, name, price, quantity }] - for general events
  const [selectedTickets, setSelectedTickets] = useState([]);
  
  // Selected seats array: [{ id, section, row, seat, price }] - for seated events
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Service fee
  const [serviceFee] = useState(150);

  // Set the current event
  const selectEvent = useCallback((event) => {
    setSelectedEvent(event);
    // Reset selections when changing event
    setSelectedFunction(null);
    setSelectedTickets([]);
    setSelectedSeats([]);
  }, []);

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

  // Clear all selections
  const clearPurchase = useCallback(() => {
    setSelectedEvent(null);
    setSelectedFunction(null);
    setSelectedTickets([]);
    setSelectedSeats([]);
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
    // saleType = "seated" -> use seats only
    // saleType = "general" -> use tickets only
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
    getPurchaseSummary
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
