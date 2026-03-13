import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import Header from './Header';
import Footer from './Footer';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  CheckCircle2,
  Download,
  Mail,
  User,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { usePurchase } from '../context/PurchaseContext';

const ConfirmationPage = () => {
  const { id, orderId: orderIdFromUrl } = useParams();
  const navigate = useNavigate();
  const { clearPurchase, formatPrice } = usePurchase();

  const [confirmationData, setConfirmationData] = useState(null);
  const [generatedTickets, setGeneratedTickets] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('prontoticket_confirmation');
    if (!stored) {
      navigate('/');
      return;
    }

    try {
      const data = JSON.parse(stored);

      // Si el orderId viene en URL, lo preferimos
      const finalOrderId = orderIdFromUrl || data.orderId;
      const normalized = { ...data, orderId: finalOrderId };

      setConfirmationData(normalized);

      // Tickets reales del backend (guardados por CheckoutPage)
      const backendTickets = Array.isArray(normalized.backendTickets)
        ? normalized.backendTickets
        : [];
      setGeneratedTickets(backendTickets);

      clearPurchase();
    } catch (e) {
      console.error('[ConfirmationPage] Failed to parse confirmation data:', e);
      navigate('/');
    }
  }, [clearPurchase, navigate, orderIdFromUrl]);

  const handleCopyOrderId = () => {
    if (confirmationData?.orderId) {
      navigator.clipboard.writeText(confirmationData.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateTicketPDF = (ticket, orderData, ticketIndex, totalTickets) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ProntoTicketLive - Entrada', margin, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Ticket ${ticketIndex + 1} de ${totalTickets}`, margin, 28);

    doc.setFontSize(10);
    doc.text(`Order ID: ${orderData.orderId || ''}`, margin, 38);
    doc.text(`Ticket ID: ${ticket.id || ''}`, margin, 45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(orderData.event?.title || 'Evento', margin, 58);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Fecha: ${orderData.selectedFunction?.date || orderData.event?.date || ''}`, margin, 68);
    doc.text(`Hora: ${orderData.selectedFunction?.time || orderData.event?.time || ''}`, margin, 75);
    doc.text(`Lugar: ${orderData.event?.venue || ''}`, margin, 82);
    doc.text(`Ciudad: ${orderData.event?.city || ''}`, margin, 89);

    // QR payload mínimo
    const qrPayload = JSON.stringify({
      ticketId: ticket.id,
      orderId: orderData.orderId,
      functionId: ticket.functionId,
      ticketTypeId: ticket.ticketTypeId,
      seatId: ticket.seatId,
      issuedAt: Date.now(),
    });

    doc.setFont('helvetica', 'bold');
    doc.text('QR payload:', margin, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(qrPayload, margin, 112, { maxWidth: pageWidth - margin * 2 });

    return doc;
  };

  const handleDownloadTickets = async () => {
    if (!confirmationData || isGeneratingPDF || generatedTickets.length === 0) return;

    setIsGeneratingPDF(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      for (let i = 0; i < generatedTickets.length; i++) {
        const t = generatedTickets[i];
        const doc = generateTicketPDF(t, confirmationData, i, generatedTickets.length);
        doc.save(`Ticket_${i + 1}_${t.id}.pdf`);

        if (i < generatedTickets.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    } catch (error) {
      console.error('[ConfirmationPage] Error generating PDF:', error);
      alert('Error al generar los tickets. Por favor, intenta de nuevo.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleBackToHome = () => {
    sessionStorage.removeItem('prontoticket_confirmation');
    navigate('/');
  };

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#007AFF]" />
      </div>
    );
  }

  const { orderId, event, selectedFunction, buyer, total, currency } = confirmationData;

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
                {copied ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} className="text-white/60" />
                )}
              </button>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 mb-6">
            <h2
              className="text-lg font-bold text-white mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
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
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${event?.venue}, ${event?.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#007AFF] transition-colors"
                >
                  {event?.venue}, {event?.city}
                </a>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Ticket size={18} className="text-[#007AFF]" />
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Tus entradas ({generatedTickets.length})
              </h2>
            </div>

            {generatedTickets.length === 0 ? (
              <div className="text-white/60 text-sm">
                No llegaron tickets desde el backend. Revisa que CheckoutPage esté guardando
                <code className="mx-1 px-1 rounded bg-white/10">backendTickets</code>
                en sessionStorage.
              </div>
            ) : (
              <div className="space-y-4">
                {generatedTickets.map((t, idx) => {
                  const qrData = JSON.stringify({
                    ticketId: t.id,
                    orderId,
                    eventId: event?.id || id,
                    functionId: t.functionId || selectedFunction?.id || null,
                    ticketTypeId: t.ticketTypeId,
                    seatId: t.seatId || null,
                    issuedAt: Date.now(),
                  });

                  return (
                    <div
                      key={t.id || idx}
                      className="bg-[#1E1E1E] rounded-xl p-4 border border-white/5"
                      data-testid={`ticket-${t.id || idx}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">
                            Entrada {idx + 1}
                          </p>
                          <p className="text-white/40 text-xs font-mono mt-1">{t.id}</p>
                          <p className="text-white/60 text-xs mt-1">
                            TicketTypeId: <span className="font-mono">{t.ticketTypeId}</span>
                          </p>
                          {t.seatId && (
                             <p className="text-[#FF9500] text-xs mt-1">
                             Asiento: <span className="font-mono">{t.seatId}</span>
                            </p>
                           )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center pt-3 border-t border-white/10">
                        <div className="bg-white p-2 rounded-lg">
                          <QRCodeSVG value={qrData} size={110} level="M" includeMargin={false} />
                        </div>
                        <p className="text-white/50 text-xs mt-2 text-center">
                          Presenta este QR en la entrada
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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

          {/* Buyer */}
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
              disabled={isGeneratingPDF || generatedTickets.length === 0}
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