/**
 * Ticket Service for ProntoTicketLive
 * 
 * Simulated database structure for ticket management.
 * Designed to mirror a real backend architecture.
 * 
 * NEW QR Code Structure (JSON):
 * {
 *   ticketId: string,        // Unique ticket identifier (TCK-xxx)
 *   orderId: string,         // Order identifier (ORD-xxx)
 *   eventId: string,         // Event identifier (EVT-xxx)
 *   functionId: string|null, // Function ID for multi-function events
 *   ticketTypeId: string,    // Ticket type identifier (TT-xxx)
 *   seatId: string|null,     // Seat identifier for seated events
 *   issuedAt: number         // Timestamp when ticket was issued
 * }
 */

// ============================================
// DATABASE KEYS (localStorage)
// ============================================
const DB_KEYS = {
  ORDERS: 'prontoticket_db_orders',
  TICKETS: 'prontoticket_db_tickets',
  TICKET_TYPES: 'prontoticket_db_ticket_types',
  SCANS: 'prontoticket_db_scans',
  EVENTS: 'prontoticket_db_events',
  FUNCTIONS: 'prontoticket_db_functions'
};

// ============================================
// DATABASE OPERATIONS (Simulated)
// ============================================

/**
 * Initialize the mock database with seed data
 */
export const initializeDatabase = () => {
  // Initialize events collection if not exists
  if (!localStorage.getItem(DB_KEYS.EVENTS)) {
    const eventsCollection = {
      'EVT-1': {
        id: 'EVT-1',
        title: 'Festival Músical Verano 2025',
        saleType: 'general',
        date: '15 JUN 2025',
        time: '18:00',
        venue: 'Estadio Nacional',
        city: 'Ciudad de México',
        isMultiFunction: false
      },
      'EVT-2': {
        id: 'EVT-2',
        title: 'Teatro: Noche de Gala',
        saleType: 'seated',
        date: '28 JUL 2025',
        time: '20:00',
        venue: 'Teatro Metropolitan',
        city: 'Ciudad de México',
        isMultiFunction: true
      },
      'EVT-3': {
        id: 'EVT-3',
        title: 'Concierto Internacional',
        saleType: 'general',
        date: '10 AGO 2025',
        time: '21:00',
        venue: 'Madison Square Garden',
        city: 'Nueva York',
        isMultiFunction: false
      }
    };
    localStorage.setItem(DB_KEYS.EVENTS, JSON.stringify(eventsCollection));
  }

  // Initialize functions collection if not exists
  if (!localStorage.getItem(DB_KEYS.FUNCTIONS)) {
    const functionsCollection = {
      'FUNC-EVT1-1': {
        id: 'FUNC-EVT1-1',
        eventId: 'EVT-1',
        date: '15 JUN 2025',
        time: '18:00',
        availability: 'available'
      },
      'FUNC-EVT2-1': {
        id: 'FUNC-EVT2-1',
        eventId: 'EVT-2',
        date: '28 JUL 2025',
        time: '15:00',
        availability: 'available'
      },
      'FUNC-EVT2-2': {
        id: 'FUNC-EVT2-2',
        eventId: 'EVT-2',
        date: '28 JUL 2025',
        time: '20:00',
        availability: 'available'
      },
      'FUNC-EVT2-3': {
        id: 'FUNC-EVT2-3',
        eventId: 'EVT-2',
        date: '29 JUL 2025',
        time: '15:00',
        availability: 'limited'
      },
      'FUNC-EVT2-4': {
        id: 'FUNC-EVT2-4',
        eventId: 'EVT-2',
        date: '29 JUL 2025',
        time: '20:00',
        availability: 'available'
      },
      'FUNC-EVT3-1': {
        id: 'FUNC-EVT3-1',
        eventId: 'EVT-3',
        date: '10 AGO 2025',
        time: '21:00',
        availability: 'available'
      }
    };
    localStorage.setItem(DB_KEYS.FUNCTIONS, JSON.stringify(functionsCollection));
  }

  // Initialize ticket types collection if not exists
  if (!localStorage.getItem(DB_KEYS.TICKET_TYPES)) {
    const ticketTypesCollection = {
      'TT-EVT1-GEN': { id: 'TT-EVT1-GEN', eventId: 'EVT-1', name: 'General', price: 899 },
      'TT-EVT1-VIP': { id: 'TT-EVT1-VIP', eventId: 'EVT-1', name: 'VIP', price: 1499 },
      'TT-EVT1-PLAT': { id: 'TT-EVT1-PLAT', eventId: 'EVT-1', name: 'Platino', price: 2499 },
      'TT-EVT2-PREF': { id: 'TT-EVT2-PREF', eventId: 'EVT-2', name: 'Preferente', price: 450 },
      'TT-EVT2-VIP': { id: 'TT-EVT2-VIP', eventId: 'EVT-2', name: 'VIP', price: 850 },
      'TT-EVT2-PLAT': { id: 'TT-EVT2-PLAT', eventId: 'EVT-2', name: 'Platino', price: 1200 },
      'TT-EVT3-GEN': { id: 'TT-EVT3-GEN', eventId: 'EVT-3', name: 'General', price: 150 },
      'TT-EVT3-VIP': { id: 'TT-EVT3-VIP', eventId: 'EVT-3', name: 'VIP', price: 350 },
      'TT-EVT3-BACK': { id: 'TT-EVT3-BACK', eventId: 'EVT-3', name: 'Backstage', price: 750 }
    };
    localStorage.setItem(DB_KEYS.TICKET_TYPES, JSON.stringify(ticketTypesCollection));
  }

  // Initialize empty collections
  if (!localStorage.getItem(DB_KEYS.ORDERS)) {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify({}));
  }
  if (!localStorage.getItem(DB_KEYS.TICKETS)) {
    localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify({}));
  }
  if (!localStorage.getItem(DB_KEYS.SCANS)) {
    localStorage.setItem(DB_KEYS.SCANS, JSON.stringify([]));
  }
};

// ============================================
// COLLECTION ACCESS FUNCTIONS
// ============================================

const getCollection = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : (key === DB_KEYS.SCANS ? [] : {});
  } catch (e) {
    console.error(`Error reading collection ${key}:`, e);
    return key === DB_KEYS.SCANS ? [] : {};
  }
};

const saveCollection = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Error saving collection ${key}:`, e);
    return false;
  }
};

// ============================================
// ID GENERATORS
// ============================================

/**
 * Generate unique ticket ID
 * Format: TCK-<timestamp>-<random>
 */
export const generateTicketId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TCK-${timestamp}-${random}`;
};

/**
 * Generate unique order ID
 * Format: ORD-<timestamp>-<random>
 */
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Generate event ID from raw event ID
 * Format: EVT-<id>
 */
export const generateEventId = (rawId) => {
  if (rawId?.startsWith('EVT-')) return rawId;
  return `EVT-${rawId}`;
};

/**
 * Generate function ID
 * Format: FUNC-<eventId>-<index>
 */
export const generateFunctionId = (eventId, functionIndex) => {
  const cleanEventId = eventId.replace('EVT-', '');
  return `FUNC-EVT${cleanEventId}-${functionIndex}`;
};

/**
 * Generate ticket type ID
 * Format: TT-<eventId>-<type>
 */
export const generateTicketTypeId = (eventId, typeName) => {
  const cleanEventId = eventId.replace('EVT-', '');
  const typeCode = typeName.substring(0, 4).toUpperCase().replace(/\s/g, '');
  return `TT-EVT${cleanEventId}-${typeCode}`;
};

/**
 * Generate seat ID for seated events
 * Format: SEAT-<section>-<row>-<number>
 */
export const generateSeatId = (section, row, seatNumber) => {
  return `SEAT-${section}-${row}-${seatNumber}`;
};

// ============================================
// QR CODE FUNCTIONS
// ============================================

/**
 * Generate QR code data for a ticket
 * New structure with all required fields
 */
export const generateQRCodeData = ({
  ticketId,
  orderId,
  eventId,
  functionId = null,
  ticketTypeId,
  seatId = null,
  issuedAt = Date.now()
}) => {
  const qrData = {
    ticketId,
    orderId,
    eventId,
    functionId,
    ticketTypeId,
    seatId,
    issuedAt
  };
  return JSON.stringify(qrData);
};

/**
 * Parse QR code data
 * Validates the new structure
 */
export const parseQRCodeData = (qrString) => {
  try {
    const data = JSON.parse(qrString);
    
    // Validate required fields
    if (!data.ticketId || !data.orderId || !data.eventId || !data.ticketTypeId || !data.issuedAt) {
      console.error('QR data missing required fields:', data);
      return null;
    }
    
    return {
      ticketId: data.ticketId,
      orderId: data.orderId,
      eventId: data.eventId,
      functionId: data.functionId || null,
      ticketTypeId: data.ticketTypeId,
      seatId: data.seatId || null,
      issuedAt: data.issuedAt
    };
  } catch (e) {
    console.error('Error parsing QR code:', e);
    return null;
  }
};

// ============================================
// ORDER FUNCTIONS
// ============================================

/**
 * Create a new order in the database
 */
export const createOrder = (orderData) => {
  const orders = getCollection(DB_KEYS.ORDERS);
  
  const order = {
    id: orderData.orderId,
    eventId: orderData.eventId,
    functionId: orderData.functionId || null,
    buyerInfo: orderData.buyer,
    items: orderData.items || [],
    total: orderData.total,
    currency: orderData.currency || 'MXN',
    status: 'completed',
    paymentMethod: orderData.paymentMethod || 'card',
    createdAt: Date.now(),
    ticketCount: 0
  };
  
  orders[order.id] = order;
  saveCollection(DB_KEYS.ORDERS, orders);
  
  return order;
};

/**
 * Get order by ID
 */
export const getOrderById = (orderId) => {
  const orders = getCollection(DB_KEYS.ORDERS);
  return orders[orderId] || null;
};

/**
 * Update order ticket count
 */
const updateOrderTicketCount = (orderId, count) => {
  const orders = getCollection(DB_KEYS.ORDERS);
  if (orders[orderId]) {
    orders[orderId].ticketCount = count;
    saveCollection(DB_KEYS.ORDERS, orders);
  }
};

// ============================================
// TICKET FUNCTIONS
// ============================================

/**
 * Generate tickets for an order
 * Creates one ticket per item quantity with new QR structure
 */
export const generateTicketsForOrder = (orderData) => {
  initializeDatabase(); // Ensure DB is initialized
  
  const {
    orderId,
    eventId,
    functionId = null,
    tickets: ticketItems = [],
    seats = [],
    buyer,
    event
  } = orderData;
  
  const generatedTickets = [];
  const ticketsCollection = getCollection(DB_KEYS.TICKETS);
  const events = getCollection(DB_KEYS.EVENTS);
  
  // Determine if multi-function event
  const eventData = events[eventId];
  const isMultiFunction = eventData?.isMultiFunction || (event?.functions?.length > 1);
  const resolvedFunctionId = isMultiFunction ? functionId : null;
  
  const isSeatedEvent = seats && seats.length > 0;
  const issuedAt = Date.now();
  
  if (isSeatedEvent) {
    // SEATED EVENT: One ticket per seat
    seats.forEach((seat, index) => {
      const ticketId = generateTicketId();
      const ticketTypeId = generateTicketTypeId(eventId, seat.section || seat.ticketType || 'General');
      const seatId = generateSeatId(
        seat.section || 'A',
        seat.row || '1',
        seat.number || seat.seat || (index + 1).toString()
      );
      
      const ticket = {
        // Identifiers
        ticketId,
        orderId,
        eventId,
        functionId: resolvedFunctionId,
        ticketTypeId,
        seatId,
        
        // Display info
        ticketNumber: index + 1,
        ticketType: seat.section || seat.ticketType || 'Preferente',
        price: seat.price || 0,
        
        // Seat details
        seatInfo: {
          section: seat.section || 'A',
          row: seat.row || '1',
          seat: seat.number || seat.seat || (index + 1).toString()
        },
        
        // Holder info
        holderName: `${buyer.firstName} ${buyer.lastName}`,
        holderEmail: buyer.email,
        
        // Status
        status: 'valid',
        issuedAt,
        usedAt: null,
        scannedBy: null,
        
        // QR Data
        qrData: generateQRCodeData({
          ticketId,
          orderId,
          eventId,
          functionId: resolvedFunctionId,
          ticketTypeId,
          seatId,
          issuedAt
        })
      };
      
      generatedTickets.push(ticket);
      ticketsCollection[ticketId] = ticket;
    });
  } else {
    // GENERAL ADMISSION: One ticket per quantity
    let ticketNumber = 1;
    
    ticketItems.filter(t => t.quantity > 0).forEach((item) => {
      const ticketTypeId = generateTicketTypeId(eventId, item.type || item.name);
      
      for (let i = 0; i < item.quantity; i++) {
        const ticketId = generateTicketId();
        
        const ticket = {
          // Identifiers
          ticketId,
          orderId,
          eventId,
          functionId: resolvedFunctionId,
          ticketTypeId,
          seatId: null, // General admission = no seat
          
          // Display info
          ticketNumber: ticketNumber++,
          ticketType: item.type || item.name,
          price: item.price || 0,
          
          // No seat info for GA
          seatInfo: null,
          
          // Holder info
          holderName: `${buyer.firstName} ${buyer.lastName}`,
          holderEmail: buyer.email,
          
          // Status
          status: 'valid',
          issuedAt,
          usedAt: null,
          scannedBy: null,
          
          // QR Data
          qrData: generateQRCodeData({
            ticketId,
            orderId,
            eventId,
            functionId: resolvedFunctionId,
            ticketTypeId,
            seatId: null,
            issuedAt
          })
        };
        
        generatedTickets.push(ticket);
        ticketsCollection[ticketId] = ticket;
      }
    });
  }
  
  // Save tickets to database
  saveCollection(DB_KEYS.TICKETS, ticketsCollection);
  
  // Update order with ticket count
  updateOrderTicketCount(orderId, generatedTickets.length);
  
  return generatedTickets;
};

/**
 * Get ticket by ID
 */
export const getTicketById = (ticketId) => {
  const tickets = getCollection(DB_KEYS.TICKETS);
  return tickets[ticketId] || null;
};

/**
 * Get all tickets for an order
 */
export const getTicketsByOrderId = (orderId) => {
  const tickets = getCollection(DB_KEYS.TICKETS);
  return Object.values(tickets).filter(t => t.orderId === orderId);
};

/**
 * Get all tickets for an event
 */
export const getTicketsByEventId = (eventId) => {
  const tickets = getCollection(DB_KEYS.TICKETS);
  return Object.values(tickets).filter(t => t.eventId === eventId);
};

/**
 * Get all stored tickets
 */
export const getStoredTickets = () => {
  const tickets = getCollection(DB_KEYS.TICKETS);
  return Object.values(tickets);
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate a ticket by QR code data
 * Full validation with event, function, and ticket checks
 */
export const validateTicket = (qrString, validationContext = {}) => {
  const { expectedEventId = null, expectedFunctionId = null } = validationContext;
  
  // Parse QR data
  const qrData = parseQRCodeData(qrString);
  
  if (!qrData) {
    logScan({
      ticketId: null,
      success: false,
      reason: 'INVALID_QR_FORMAT',
      timestamp: Date.now()
    });
    
    return {
      valid: false,
      status: 'invalid',
      message: 'Código QR inválido - formato no reconocido',
      errorCode: 'INVALID_QR_FORMAT',
      displayInfo: null
    };
  }
  
  const { ticketId, orderId, eventId, functionId, ticketTypeId, seatId, issuedAt } = qrData;
  
  // Check event ID matches
  if (expectedEventId && eventId !== expectedEventId) {
    logScan({
      ticketId,
      success: false,
      reason: 'WRONG_EVENT',
      expectedEventId,
      actualEventId: eventId,
      timestamp: Date.now()
    });
    
    return {
      valid: false,
      status: 'invalid',
      message: 'Este ticket no es para este evento',
      errorCode: 'WRONG_EVENT',
      ticketId,
      displayInfo: {
        ticketId,
        eventId,
        reason: 'Evento incorrecto'
      }
    };
  }
  
  // Check function ID if provided and event has functions
  if (expectedFunctionId && functionId && functionId !== expectedFunctionId) {
    logScan({
      ticketId,
      success: false,
      reason: 'WRONG_FUNCTION',
      expectedFunctionId,
      actualFunctionId: functionId,
      timestamp: Date.now()
    });
    
    return {
      valid: false,
      status: 'invalid',
      message: 'Este ticket no es para esta función',
      errorCode: 'WRONG_FUNCTION',
      ticketId,
      displayInfo: {
        ticketId,
        functionId,
        reason: 'Función incorrecta'
      }
    };
  }
  
  // Find ticket in database
  const ticket = getTicketById(ticketId);
  
  if (!ticket) {
    logScan({
      ticketId,
      success: false,
      reason: 'TICKET_NOT_FOUND',
      timestamp: Date.now()
    });
    
    return {
      valid: false,
      status: 'invalid',
      message: 'Ticket no encontrado en el sistema',
      errorCode: 'TICKET_NOT_FOUND',
      ticketId,
      displayInfo: {
        ticketId,
        reason: 'No registrado'
      }
    };
  }
  
  // Check if already used
  if (ticket.status === 'used') {
    logScan({
      ticketId,
      success: false,
      reason: 'ALREADY_USED',
      usedAt: ticket.usedAt,
      timestamp: Date.now()
    });
    
    // Get event and function info for display
    const events = getCollection(DB_KEYS.EVENTS);
    const functions = getCollection(DB_KEYS.FUNCTIONS);
    const ticketTypes = getCollection(DB_KEYS.TICKET_TYPES);
    
    const eventInfo = events[ticket.eventId];
    const functionInfo = ticket.functionId ? functions[ticket.functionId] : null;
    const typeInfo = ticketTypes[ticket.ticketTypeId];
    
    return {
      valid: false,
      status: 'used',
      message: 'ACCESO DENEGADO - Ticket ya utilizado',
      errorCode: 'ALREADY_USED',
      ticketId,
      usedAt: ticket.usedAt,
      displayInfo: {
        ticketId: ticket.ticketId,
        event: eventInfo?.title || 'Evento',
        function: functionInfo ? `${functionInfo.date} - ${functionInfo.time}` : null,
        ticketType: typeInfo?.name || ticket.ticketType,
        seat: ticket.seatInfo 
          ? `${ticket.seatInfo.section} - Fila ${ticket.seatInfo.row}, Asiento ${ticket.seatInfo.seat}`
          : null,
        holderName: ticket.holderName,
        status: 'DENEGADO',
        usedAt: new Date(ticket.usedAt).toLocaleString()
      }
    };
  }
  
  // VALID TICKET - Mark as used
  markTicketAsUsed(ticketId);
  
  // Get event and function info for display
  const events = getCollection(DB_KEYS.EVENTS);
  const functions = getCollection(DB_KEYS.FUNCTIONS);
  const ticketTypes = getCollection(DB_KEYS.TICKET_TYPES);
  
  const eventInfo = events[ticket.eventId];
  const functionInfo = ticket.functionId ? functions[ticket.functionId] : null;
  const typeInfo = ticketTypes[ticket.ticketTypeId];
  
  logScan({
    ticketId,
    success: true,
    reason: 'VALID',
    timestamp: Date.now()
  });
  
  return {
    valid: true,
    status: 'valid',
    message: '✓ ACCESO PERMITIDO',
    ticketId,
    displayInfo: {
      ticketId: ticket.ticketId,
      event: eventInfo?.title || 'Evento',
      function: functionInfo ? `${functionInfo.date} - ${functionInfo.time}` : null,
      ticketType: typeInfo?.name || ticket.ticketType,
      seat: ticket.seatInfo 
        ? `${ticket.seatInfo.section} - Fila ${ticket.seatInfo.row}, Asiento ${ticket.seatInfo.seat}`
        : null,
      holderName: ticket.holderName,
      status: 'ADMITIDO'
    }
  };
};

/**
 * Mark a ticket as used
 */
export const markTicketAsUsed = (ticketId, scannedBy = 'staff') => {
  const tickets = getCollection(DB_KEYS.TICKETS);
  
  if (tickets[ticketId] && tickets[ticketId].status === 'valid') {
    tickets[ticketId].status = 'used';
    tickets[ticketId].usedAt = Date.now();
    tickets[ticketId].scannedBy = scannedBy;
    saveCollection(DB_KEYS.TICKETS, tickets);
    return true;
  }
  
  return false;
};

// ============================================
// SCAN LOGGING
// ============================================

/**
 * Log a scan attempt
 */
export const logScan = (scanData) => {
  const scans = getCollection(DB_KEYS.SCANS);
  
  const scan = {
    id: `SCAN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ticketId: scanData.ticketId,
    success: scanData.success,
    reason: scanData.reason,
    timestamp: scanData.timestamp || Date.now(),
    metadata: scanData
  };
  
  scans.unshift(scan); // Add to beginning
  
  // Keep only last 500 scans
  if (scans.length > 500) {
    scans.length = 500;
  }
  
  saveCollection(DB_KEYS.SCANS, scans);
  return scan;
};

/**
 * Get recent scans
 */
export const getRecentScans = (limit = 50) => {
  const scans = getCollection(DB_KEYS.SCANS);
  return scans.slice(0, limit);
};

// ============================================
// STATISTICS
// ============================================

/**
 * Get scan statistics for an event
 */
export const getScanStats = (eventId = null) => {
  const tickets = getCollection(DB_KEYS.TICKETS);
  const scans = getCollection(DB_KEYS.SCANS);
  
  let ticketList = Object.values(tickets);
  let scanList = scans;
  
  // Filter by event if provided
  if (eventId) {
    ticketList = ticketList.filter(t => t.eventId === eventId);
    scanList = scanList.filter(s => {
      const ticket = tickets[s.ticketId];
      return ticket && ticket.eventId === eventId;
    });
  }
  
  const totalTickets = ticketList.length;
  const usedTickets = ticketList.filter(t => t.status === 'used').length;
  const validTickets = ticketList.filter(t => t.status === 'valid').length;
  
  return {
    totalTickets,
    usedTickets,
    validTickets,
    totalScans: scanList.length,
    successfulScans: scanList.filter(s => s.success).length,
    failedScans: scanList.filter(s => !s.success).length
  };
};

// ============================================
// EVENT & FUNCTION HELPERS
// ============================================

/**
 * Get event from database
 */
export const getEventFromDB = (eventId) => {
  initializeDatabase();
  const events = getCollection(DB_KEYS.EVENTS);
  return events[eventId] || null;
};

/**
 * Get functions for an event
 */
export const getFunctionsForEvent = (eventId) => {
  initializeDatabase();
  const functions = getCollection(DB_KEYS.FUNCTIONS);
  return Object.values(functions).filter(f => f.eventId === eventId);
};

/**
 * Get ticket types for an event
 */
export const getTicketTypesForEvent = (eventId) => {
  initializeDatabase();
  const ticketTypes = getCollection(DB_KEYS.TICKET_TYPES);
  return Object.values(ticketTypes).filter(tt => tt.eventId === eventId);
};

// ============================================
// DATABASE MANAGEMENT
// ============================================

/**
 * Clear all tickets and scans (for testing)
 */
export const clearAllTickets = () => {
  localStorage.removeItem(DB_KEYS.TICKETS);
  localStorage.removeItem(DB_KEYS.SCANS);
  localStorage.removeItem(DB_KEYS.ORDERS);
  localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify({}));
  localStorage.setItem(DB_KEYS.SCANS, JSON.stringify([]));
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify({}));
};

/**
 * Reset entire database (including seed data)
 */
export const resetDatabase = () => {
  Object.values(DB_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  initializeDatabase();
};

/**
 * Export database state (for debugging)
 */
export const exportDatabaseState = () => {
  return {
    orders: getCollection(DB_KEYS.ORDERS),
    tickets: getCollection(DB_KEYS.TICKETS),
    ticketTypes: getCollection(DB_KEYS.TICKET_TYPES),
    scans: getCollection(DB_KEYS.SCANS),
    events: getCollection(DB_KEYS.EVENTS),
    functions: getCollection(DB_KEYS.FUNCTIONS)
  };
};

// Initialize database on module load
initializeDatabase();

export default {
  // ID Generators
  generateTicketId,
  generateOrderId,
  generateEventId,
  generateFunctionId,
  generateTicketTypeId,
  generateSeatId,
  
  // QR Functions
  generateQRCodeData,
  parseQRCodeData,
  
  // Order Functions
  createOrder,
  getOrderById,
  
  // Ticket Functions
  generateTicketsForOrder,
  getTicketById,
  getTicketsByOrderId,
  getTicketsByEventId,
  getStoredTickets,
  
  // Validation
  validateTicket,
  markTicketAsUsed,
  
  // Logging & Stats
  logScan,
  getRecentScans,
  getScanStats,
  
  // Event Helpers
  getEventFromDB,
  getFunctionsForEvent,
  getTicketTypesForEvent,
  
  // Database Management
  initializeDatabase,
  clearAllTickets,
  resetDatabase,
  exportDatabaseState
};
