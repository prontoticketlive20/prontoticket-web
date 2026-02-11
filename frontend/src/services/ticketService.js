/**
 * Ticket Service for ProntoTicketLive
 * 
 * Manages ticket generation, storage, and validation.
 * Uses localStorage for persistence (mock implementation).
 * 
 * Ticket ID Format: TCK-<timestamp>-<random>
 * QR Code Format: JSON { ticketId, orderId, eventId }
 */

const TICKETS_STORAGE_KEY = 'prontoticket_tickets';
const SCANNED_TICKETS_KEY = 'prontoticket_scanned';

/**
 * Generate a unique ticket ID
 * Format: TCK-<timestamp>-<random>
 */
export const generateTicketId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TCK-${timestamp}-${random}`;
};

/**
 * Generate order ID
 * Format: ORD-<timestamp>
 */
export const generateOrderId = () => {
  return `ORD-${Date.now()}`;
};

/**
 * Generate event ID from event data
 * Format: EVT-<id>
 */
export const generateEventId = (eventId) => {
  return `EVT-${eventId}`;
};

/**
 * Generate QR code data for a ticket
 * Returns JSON string with ticketId, orderId, eventId
 */
export const generateQRCodeData = (ticketId, orderId, eventId) => {
  const qrData = {
    ticketId,
    orderId,
    eventId
  };
  return JSON.stringify(qrData);
};

/**
 * Parse QR code data
 * Returns parsed object or null if invalid
 */
export const parseQRCodeData = (qrString) => {
  try {
    const data = JSON.parse(qrString);
    
    // Validate required fields
    if (!data.ticketId || !data.orderId || !data.eventId) {
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Error parsing QR code:', e);
    return null;
  }
};

/**
 * Generate tickets for an order
 * Creates one ticket per item quantity
 */
export const generateTicketsForOrder = (orderData) => {
  const { orderId, eventId, tickets: ticketItems, seats, buyer } = orderData;
  const generatedTickets = [];
  
  const isSeatedEvent = seats && seats.length > 0;
  
  if (isSeatedEvent) {
    // One ticket per seat
    seats.forEach((seat, index) => {
      const ticketId = generateTicketId();
      const ticket = {
        ticketId,
        orderId,
        eventId,
        ticketNumber: index + 1,
        ticketType: seat.section || 'Asiento',
        price: seat.price,
        seatInfo: {
          section: seat.section,
          row: seat.row,
          seat: seat.number || seat.seat
        },
        holderName: `${buyer.firstName} ${buyer.lastName}`,
        holderEmail: buyer.email,
        status: 'valid',
        createdAt: new Date().toISOString(),
        usedAt: null,
        qrData: generateQRCodeData(ticketId, orderId, eventId)
      };
      generatedTickets.push(ticket);
    });
  } else {
    // One ticket per quantity in each ticket type
    let ticketNumber = 1;
    ticketItems.filter(t => t.quantity > 0).forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        const ticketId = generateTicketId();
        const ticket = {
          ticketId,
          orderId,
          eventId,
          ticketNumber: ticketNumber++,
          ticketType: item.type || item.name,
          price: item.price,
          seatInfo: null,
          holderName: `${buyer.firstName} ${buyer.lastName}`,
          holderEmail: buyer.email,
          status: 'valid',
          createdAt: new Date().toISOString(),
          usedAt: null,
          qrData: generateQRCodeData(ticketId, orderId, eventId)
        };
        generatedTickets.push(ticket);
      }
    });
  }
  
  // Save tickets to localStorage
  saveTickets(generatedTickets);
  
  return generatedTickets;
};

/**
 * Save tickets to localStorage
 */
export const saveTickets = (newTickets) => {
  try {
    const existingTickets = getStoredTickets();
    const allTickets = [...existingTickets, ...newTickets];
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(allTickets));
  } catch (e) {
    console.error('Error saving tickets:', e);
  }
};

/**
 * Get all stored tickets
 */
export const getStoredTickets = () => {
  try {
    const stored = localStorage.getItem(TICKETS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading tickets:', e);
    return [];
  }
};

/**
 * Get ticket by ID
 */
export const getTicketById = (ticketId) => {
  const tickets = getStoredTickets();
  return tickets.find(t => t.ticketId === ticketId) || null;
};

/**
 * Get tickets by order ID
 */
export const getTicketsByOrderId = (orderId) => {
  const tickets = getStoredTickets();
  return tickets.filter(t => t.orderId === orderId);
};

/**
 * Validate a ticket by QR code data
 * Returns validation result
 */
export const validateTicket = (qrString, expectedEventId = null) => {
  // Parse QR data
  const qrData = parseQRCodeData(qrString);
  
  if (!qrData) {
    return {
      valid: false,
      status: 'invalid',
      message: 'Código QR inválido - formato no reconocido',
      errorCode: 'INVALID_QR_FORMAT'
    };
  }
  
  const { ticketId, orderId, eventId } = qrData;
  
  // Check event ID if provided
  if (expectedEventId && eventId !== expectedEventId) {
    return {
      valid: false,
      status: 'invalid',
      message: 'Este ticket no es para este evento',
      errorCode: 'WRONG_EVENT',
      ticketId,
      eventId
    };
  }
  
  // Find ticket in storage
  const ticket = getTicketById(ticketId);
  
  if (!ticket) {
    return {
      valid: false,
      status: 'invalid',
      message: 'Ticket no encontrado en el sistema',
      errorCode: 'TICKET_NOT_FOUND',
      ticketId
    };
  }
  
  // Check if already used
  if (ticket.status === 'used') {
    return {
      valid: false,
      status: 'used',
      message: 'ACCESO DENEGADO - Este ticket ya fue utilizado',
      errorCode: 'ALREADY_USED',
      ticketId,
      ticket,
      usedAt: ticket.usedAt
    };
  }
  
  // Valid ticket - mark as used
  markTicketAsUsed(ticketId);
  
  return {
    valid: true,
    status: 'valid',
    message: '✓ ACCESO PERMITIDO',
    ticketId,
    ticket: {
      ...ticket,
      status: 'used',
      usedAt: new Date().toISOString()
    }
  };
};

/**
 * Mark a ticket as used
 */
export const markTicketAsUsed = (ticketId) => {
  try {
    const tickets = getStoredTickets();
    const updatedTickets = tickets.map(t => {
      if (t.ticketId === ticketId && t.status === 'valid') {
        return {
          ...t,
          status: 'used',
          usedAt: new Date().toISOString()
        };
      }
      return t;
    });
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updatedTickets));
    
    // Also log the scan
    logScan(ticketId, true);
    
    return true;
  } catch (e) {
    console.error('Error marking ticket as used:', e);
    return false;
  }
};

/**
 * Log a scan attempt
 */
export const logScan = (ticketId, success) => {
  try {
    const scans = getScannedTickets();
    scans.push({
      ticketId,
      success,
      scannedAt: new Date().toISOString()
    });
    localStorage.setItem(SCANNED_TICKETS_KEY, JSON.stringify(scans));
  } catch (e) {
    console.error('Error logging scan:', e);
  }
};

/**
 * Get scanned tickets log
 */
export const getScannedTickets = () => {
  try {
    const stored = localStorage.getItem(SCANNED_TICKETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Get scan statistics
 */
export const getScanStats = () => {
  const tickets = getStoredTickets();
  const scans = getScannedTickets();
  
  const totalTickets = tickets.length;
  const usedTickets = tickets.filter(t => t.status === 'used').length;
  const validTickets = tickets.filter(t => t.status === 'valid').length;
  
  return {
    totalTickets,
    usedTickets,
    validTickets,
    totalScans: scans.length,
    successfulScans: scans.filter(s => s.success).length,
    failedScans: scans.filter(s => !s.success).length
  };
};

/**
 * Clear all tickets (for testing)
 */
export const clearAllTickets = () => {
  localStorage.removeItem(TICKETS_STORAGE_KEY);
  localStorage.removeItem(SCANNED_TICKETS_KEY);
};

export default {
  generateTicketId,
  generateOrderId,
  generateEventId,
  generateQRCodeData,
  parseQRCodeData,
  generateTicketsForOrder,
  getStoredTickets,
  getTicketById,
  getTicketsByOrderId,
  validateTicket,
  markTicketAsUsed,
  getScanStats,
  clearAllTickets
};
