import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import Header from './Header';
import Footer from './Footer';
import { 
  Calendar, Clock, MapPin, Ticket, CheckCircle2, Download, 
  Mail, User, Copy, Check, Loader2
} from 'lucide-react';
import { usePurchase } from '../context/PurchaseContext';
import { 
  generateTicketsForOrder, 
  generateOrderId, 
  generateEventId,
  generateFunctionId,
  getTicketsByOrderId,
  createOrder
} from '../services/ticketService';

/**
 * Confirmation Page
 * 
 * Displays purchase confirmation and generates tickets with QR codes.
 * 
 * NEW QR Structure:
 * {
 *   ticketId: string,
 *   orderId: string,
 *   eventId: string,
 *   functionId: string | null,  // null for single-function events
 *   ticketTypeId: string,
 *   seatId: string | null,      // null for general admission
 *   issuedAt: number
 * }
 */

const ConfirmationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clearPurchase, formatPrice } = usePurchase();
  
  const [confirmationData, setConfirmationData] = useState(null);
  const [generatedTickets, setGeneratedTickets] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Load confirmation data and generate tickets
  useEffect(() => {
    const stored = sessionStorage.getItem('prontoticket_confirmation');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setConfirmationData(data);
        
        // Generate IDs
        const orderId = data.orderId || generateOrderId();
        const eventId = generateEventId(data.event?.id || id);
        
        // Determine function ID
        // Multi-function event: use selected function ID
        // Single-function event: functionId = null
        const isMultiFunction = data.event?.functions?.length > 1;
        let functionId = null;
        
        if (isMultiFunction && data.selectedFunction) {
          // Find the function index
          const funcIndex = data.event.functions.findIndex(
            f => f.id === data.selectedFunction.id || 
                 (f.date === data.selectedFunction.date && f.time === data.selectedFunction.time)
          );
          functionId = generateFunctionId(eventId, funcIndex + 1);
        }
        
        // Check if tickets already generated for this order
        const existingTickets = getTicketsByOrderId(orderId);
        
        if (existingTickets.length > 0) {
          setGeneratedTickets(existingTickets);
        } else {
          // Create order in database
          createOrder({
            orderId,
            eventId,
            functionId,
            buyer: data.buyer || { firstName: 'Guest', lastName: '', email: '' },
            items: data.tickets || [],
            total: data.total,
            currency: data.currency?.code || 'MXN',
            paymentMethod: 'card'
          });
          
          // Generate new tickets
          const orderData = {
            orderId,
            eventId,
            functionId,
            tickets: data.tickets || [],
            seats: data.seats || [],
            buyer: data.buyer || { firstName: 'Guest', lastName: '', email: '' },
            event: data.event
          };
          
          const tickets = generateTicketsForOrder(orderData);
          setGeneratedTickets(tickets);
          
          // Update confirmation data with generated IDs
          const updatedData = { ...data, orderId, eventId, functionId };
          sessionStorage.setItem('prontoticket_confirmation', JSON.stringify(updatedData));
          setConfirmationData(updatedData);
        }
        
        // Clear purchase state
        clearPurchase();
      } catch (e) {
        console.error('Failed to parse confirmation data:', e);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [clearPurchase, navigate, id]);

  const handleCopyOrderId = () => {
    if (confirmationData?.orderId) {
      navigator.clipboard.writeText(confirmationData.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTickets = async () => {
    if (!confirmationData || isGeneratingPDF || generatedTickets.length === 0) return;
    
    setIsGeneratingPDF(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate PDF for each ticket
      for (let i = 0; i < generatedTickets.length; i++) {
        const ticket = generatedTickets[i];
        const doc = generateTicketPDF(ticket, confirmationData);
        
        const filename = `Ticket_${ticket.ticketNumber}_${ticket.ticketId}.pdf`;
        doc.save(filename);
        
        // Small delay between downloads
        if (i < generatedTickets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar los tickets. Por favor, intenta de nuevo.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Generate PDF for a single ticket
  const generateTicketPDF = (ticket, orderData) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Colors
    const primaryBlue = [0, 122, 255];
    const accentOrange = [255, 149, 0];
    const darkBg = [18, 18, 18];
    const white = [255, 255, 255];
    const gray = [150, 150, 150];
    
    // Background
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageWidth, 297, 'F');
    
    // Header
    doc.setFillColor(...primaryBlue);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Logo
    doc.setTextColor(...white);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PRONTO', margin, 22);
    doc.setTextColor(...accentOrange);
    doc.text('TICKET', margin + 52, 22);
    doc.setTextColor(...white);
    doc.setFontSize(12);
    doc.text('LIVE', margin + 85, 22);
    
    // Tagline
    doc.setFontSize(10);
    doc.text('Fácil, Rápido y Seguro', margin, 35);
    
    // Ticket title
    let yPos = 60;
    doc.setFontSize(12);
    doc.setTextColor(...gray);
    doc.text(`ENTRADA ${ticket.ticketNumber} DE ${generatedTickets.length}`, margin, yPos);
    
    // Event name
    yPos += 12;
    doc.setFontSize(20);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    const eventTitle = orderData.event?.title || 'Evento';
    const splitTitle = doc.splitTextToSize(eventTitle, pageWidth - margin * 2);
    doc.text(splitTitle, margin, yPos);
    yPos += (splitTitle.length * 8) + 5;
    
    // Divider
    doc.setDrawColor(...primaryBlue);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;
    
    // Event details - Date/Time
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text('FECHA Y HORA', margin, yPos);
    yPos += 6;
    doc.setFontSize(14);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    const eventDate = orderData.selectedFunction?.date || orderData.event?.date || '';
    const eventTime = orderData.selectedFunction?.time || orderData.event?.time || '';
    doc.text(`${eventDate} - ${eventTime} hrs`, margin, yPos);
    
    // Venue
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text('LUGAR', pageWidth / 2 + 10, yPos - 6);
    doc.setFontSize(14);
    doc.setTextColor(...white);
    doc.text(orderData.event?.venue || '', pageWidth / 2 + 10, yPos);
    yPos += 6;
    doc.setFontSize(11);
    doc.setTextColor(...gray);
    doc.text(orderData.event?.city || '', pageWidth / 2 + 10, yPos);
    
    yPos += 20;
    
    // Function info (if multi-function)
    if (ticket.functionId) {
      doc.setDrawColor(50, 50, 50);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(...gray);
      doc.text('FUNCIÓN', margin, yPos);
      yPos += 6;
      doc.setFontSize(14);
      doc.setTextColor(...accentOrange);
      doc.text(`${eventDate} - ${eventTime}`, margin, yPos);
      yPos += 15;
    }
    
    // Ticket type
    doc.setDrawColor(50, 50, 50);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text('TIPO DE ENTRADA', margin, yPos);
    yPos += 8;
    doc.setFontSize(16);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.text(ticket.ticketType, margin, yPos);
    
    // Seat info if applicable
    if (ticket.seatInfo) {
      doc.setFontSize(12);
      doc.setTextColor(...accentOrange);
      yPos += 8;
      doc.text(`Sección: ${ticket.seatInfo.section} | Fila: ${ticket.seatInfo.row} | Asiento: ${ticket.seatInfo.seat}`, margin, yPos);
    }
    
    yPos += 20;
    
    // IDs section
    doc.setDrawColor(50, 50, 50);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text('TICKET ID', margin, yPos);
    doc.text('ORDER ID', pageWidth / 2 + 10, yPos);
    yPos += 6;
    doc.setFontSize(11);
    doc.setTextColor(...accentOrange);
    doc.setFont('helvetica', 'bold');
    doc.text(ticket.ticketId, margin, yPos);
    doc.text(ticket.orderId, pageWidth / 2 + 10, yPos);
    
    yPos += 15;
    
    // Holder
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text('TITULAR', margin, yPos);
    yPos += 6;
    doc.setFontSize(12);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    doc.text(ticket.holderName, margin, yPos);
    
    // QR Code section
    yPos = 195;
    
    // White background for QR
    const qrSize = 55;
    const qrX = (pageWidth - qrSize) / 2;
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 5, yPos - 5, qrSize + 10, qrSize + 10, 3, 3, 'F');
    
    // Draw simplified QR pattern
    doc.setFillColor(0, 0, 0);
    const scale = qrSize / 120;
    
    // Position detection patterns
    const patterns = [
      [8, 8, 28, 28], [84, 8, 28, 28], [8, 84, 28, 28]
    ];
    patterns.forEach(([x, y, w, h]) => {
      doc.rect(qrX + x * scale, yPos + y * scale, w * scale, h * scale, 'F');
    });
    
    // Inner white
    doc.setFillColor(255, 255, 255);
    [[12, 12, 20, 20], [88, 12, 20, 20], [12, 88, 20, 20]].forEach(([x, y, w, h]) => {
      doc.rect(qrX + x * scale, yPos + y * scale, w * scale, h * scale, 'F');
    });
    
    // Inner black
    doc.setFillColor(0, 0, 0);
    [[16, 16, 12, 12], [92, 16, 12, 12], [16, 92, 12, 12]].forEach(([x, y, w, h]) => {
      doc.rect(qrX + x * scale, yPos + y * scale, w * scale, h * scale, 'F');
    });
    
    // Data modules
    const dataModules = [
      [44, 8, 8, 8], [56, 8, 8, 8], [68, 8, 8, 8],
      [44, 44, 8, 8], [56, 44, 8, 8], [68, 44, 8, 8],
      [44, 56, 8, 8], [56, 56, 8, 8], [68, 56, 8, 8],
      [44, 84, 8, 8], [60, 84, 8, 8], [84, 44, 8, 8],
      [84, 56, 8, 8], [96, 56, 8, 8], [84, 68, 8, 8],
      [44, 96, 8, 8], [56, 96, 8, 8], [84, 84, 8, 8]
    ];
    dataModules.forEach(([x, y, w, h]) => {
      doc.rect(qrX + x * scale, yPos + y * scale, w * scale, h * scale, 'F');
    });
    
    yPos += qrSize + 15;
    
    // QR instruction
    doc.setFontSize(10);
    doc.setTextColor(...white);
    const qrText = 'Presenta este código QR en la entrada del evento';
    const textWidth = doc.getTextWidth(qrText);
    doc.text(qrText, (pageWidth - textWidth) / 2, yPos);
    
    // QR Data reference (small, for debugging)
    yPos += 8;
    doc.setFontSize(5);
    doc.setTextColor(80, 80, 80);
    const qrDataParsed = JSON.parse(ticket.qrData);
    const dataRef = `ID:${qrDataParsed.ticketId} | EVT:${qrDataParsed.eventId} | TT:${qrDataParsed.ticketTypeId}`;
    const dataWidth = doc.getTextWidth(dataRef);
    doc.text(dataRef, (pageWidth - dataWidth) / 2, yPos);
    
    // Footer
    yPos = 280;
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    const footerText = 'Este boleto es personal e intransferible. ProntoTicketLive © 2025';
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, yPos);
    
    return doc;
  };

  const handleBackToHome = () => {
    sessionStorage.removeItem('prontoticket_confirmation');
    navigate('/');
  };

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#007AFF]"></div>
      </div>
    );
  }

  const { orderId, event, selectedFunction, buyer, total, currency, functionId } = confirmationData;
  const isSeatedEvent = generatedTickets.some(t => t.seatInfo);
  const isMultiFunction = event?.functions?.length > 1;

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="confirmation-page">
      <Header />

      <div className="pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h1 
              className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              ¡Compra exitosa!
            </h1>
            <p className="text-white/60">
              Se generaron {generatedTickets.length} entrada(s)
            </p>
          </div>

          {/* Order ID */}
          <div className="bg-gradient-to-r from-[#007AFF]/20 to-[#FF9500]/20 rounded-2xl border border-white/10 p-4 mb-6 text-center">
            <p className="text-white/60 text-sm mb-1">Número de pedido</p>
            <div className="flex items-center justify-center space-x-2">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-wider font-mono">
                {orderId}
              </p>
              <button
                onClick={handleCopyOrderId}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                data-testid="copy-order-id"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-white/60" />}
              </button>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 mb-6">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Detalles del evento
            </h2>
            
            <h3 className="text-white font-semibold text-lg mb-3">{event?.title}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-white/70">
                <Calendar size={14} className="text-[#007AFF]" />
                <span>{selectedFunction?.date || event?.date}</span>
              </div>
              <div className="flex items-center space-x-2 text-white/70">
                <Clock size={14} className="text-[#FF9500]" />
                <span>{selectedFunction?.time || event?.time} hrs</span>
              </div>
              <div className="flex items-center space-x-2 text-white/70">
                <MapPin size={14} className="text-[#007AFF]" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event?.venue}, ${event?.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#007AFF] transition-colors"
                >
                  {event?.venue}, {event?.city}
                </a>
              </div>
            </div>
            
            {/* Function badge for multi-function events */}
            {isMultiFunction && selectedFunction && (
              <div className="mt-4 p-3 bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-xl">
                <p className="text-[#FF9500] text-sm font-medium">
                  Función: {selectedFunction.date} - {selectedFunction.time}
                </p>
              </div>
            )}
          </div>

          {/* Generated Tickets */}
          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Ticket size={18} className="text-[#007AFF]" />
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Tus entradas ({generatedTickets.length})
              </h2>
            </div>

            <div className="space-y-4">
              {generatedTickets.map((ticket) => {
                // Parse QR data to show structure
                const qrParsed = JSON.parse(ticket.qrData);
                
                return (
                  <div 
                    key={ticket.ticketId}
                    className="bg-[#1E1E1E] rounded-xl p-4 border border-white/5"
                    data-testid={`ticket-${ticket.ticketId}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">
                          Entrada {ticket.ticketNumber} - {ticket.ticketType}
                        </p>
                        {ticket.seatInfo && (
                          <p className="text-[#FF9500] text-sm font-medium">
                            {ticket.seatInfo.section} - Fila {ticket.seatInfo.row}, Asiento {ticket.seatInfo.seat}
                          </p>
                        )}
                        <p className="text-white/40 text-xs font-mono mt-1">
                          {ticket.ticketId}
                        </p>
                      </div>
                      <span className="text-[#FF9500] font-bold">
                        {formatPrice(ticket.price)}
                      </span>
                    </div>
                    
                    {/* QR Code */}
                    <div className="flex flex-col items-center pt-3 border-t border-white/10">
                      <div className="bg-white p-2 rounded-lg">
                        <QRCodeSVG 
                          value={ticket.qrData}
                          size={100}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-white/50 text-xs mt-2 text-center">
                        Presenta este QR en la entrada
                      </p>
                      
                      {/* QR Data Preview (collapsed) */}
                      <details className="mt-2 w-full">
                        <summary className="text-white/30 text-xs cursor-pointer hover:text-white/50">
                          Ver datos del QR
                        </summary>
                        <div className="mt-2 p-2 bg-black/30 rounded text-xs font-mono text-white/40 overflow-x-auto">
                          <div>ticketId: {qrParsed.ticketId}</div>
                          <div>orderId: {qrParsed.orderId}</div>
                          <div>eventId: {qrParsed.eventId}</div>
                          <div>functionId: {qrParsed.functionId || 'null'}</div>
                          <div>ticketTypeId: {qrParsed.ticketTypeId}</div>
                          <div>seatId: {qrParsed.seatId || 'null'}</div>
                          <div>issuedAt: {new Date(qrParsed.issuedAt).toLocaleString()}</div>
                        </div>
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-baseline">
              <span className="text-white font-bold">Total pagado</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#FF9500]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {formatPrice(total)}
                </div>
                <div className="text-white/40 text-xs">{currency?.code || 'MXN'}</div>
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <User size={16} className="text-[#007AFF]" />
              <h3 className="text-white font-semibold">Comprador</h3>
            </div>
            <p className="text-white/80">{buyer?.firstName} {buyer?.lastName}</p>
            <p className="text-white/60 text-sm">{buyer?.email}</p>
          </div>

          {/* Email Notice */}
          <div className="bg-[#007AFF]/10 rounded-xl border border-[#007AFF]/20 p-4 mb-6 flex items-start space-x-3">
            <Mail size={18} className="text-[#007AFF] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">Revisa tu correo</p>
              <p className="text-white/60 text-sm">
                También enviamos las entradas a {buyer?.email}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadTickets}
              disabled={isGeneratingPDF}
              className="w-full py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold rounded-xl transition-all duration-300 hover:brightness-110 flex items-center justify-center space-x-2 disabled:opacity-70"
              data-testid="download-tickets-button"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generando tickets...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Descargar {generatedTickets.length} entrada(s)</span>
                </>
              )}
            </button>

            <button
              onClick={handleBackToHome}
              className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors text-sm"
              data-testid="back-to-home"
            >
              Volver al inicio
            </button>
          </div>

          {/* Important Notice */}
          <p className="mt-6 text-center text-white/40 text-xs">
            Cada código QR es único y solo puede usarse una vez.
          </p>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ConfirmationPage;
