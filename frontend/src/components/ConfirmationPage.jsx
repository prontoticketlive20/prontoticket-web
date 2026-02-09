import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { 
  Calendar, Clock, MapPin, Ticket, CheckCircle2, Download, 
  Mail, User, QrCode, Copy, Check
} from 'lucide-react';
import { usePurchase } from '../context/PurchaseContext';

const ConfirmationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clearPurchase, formatPrice } = usePurchase();
  
  const [confirmationData, setConfirmationData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load confirmation data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('prontoticket_confirmation');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setConfirmationData(data);
        // Clear purchase state after successful confirmation
        clearPurchase();
      } catch (e) {
        console.error('Failed to parse confirmation data:', e);
        navigate('/');
      }
    } else {
      // No confirmation data, redirect to home
      navigate('/');
    }
  }, [clearPurchase, navigate]);

  const handleCopyOrderId = () => {
    if (confirmationData?.orderId) {
      navigator.clipboard.writeText(confirmationData.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTickets = () => {
    // In production, this would download PDF tickets
    alert('Descargando entradas... (Funcionalidad próximamente)');
  };

  const handleBackToHome = () => {
    // Clear confirmation data
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

  const { event, selectedFunction, tickets, seats, buyer, total, currency, orderId } = confirmationData;
  const isSeatedEvent = seats && seats.length > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="confirmation-page">
      <Header />

      <div className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
              data-testid="page-title"
            >
              ¡Compra exitosa!
            </h1>
            <p className="text-white/60 text-base sm:text-lg">
              Tu pedido ha sido confirmado. Recibirás un email con los detalles.
            </p>
          </div>

          {/* Order ID */}
          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6 mb-6" data-testid="order-id-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Número de orden</p>
                <p className="text-white font-bold text-lg sm:text-xl font-mono" data-testid="order-id">
                  {orderId}
                </p>
              </div>
              <button
                onClick={handleCopyOrderId}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-2"
                title="Copiar número de orden"
              >
                {copied ? (
                  <Check size={18} className="text-green-500" />
                ) : (
                  <Copy size={18} className="text-white/60" />
                )}
              </button>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6 mb-6" data-testid="event-details-card">
            <h2 
              className="text-lg font-bold text-white mb-4 tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Detalles del evento
            </h2>

            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gradient-to-br from-[#007AFF]/20 to-[#FF9500]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <QrCode size={40} className="text-white/60" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-base sm:text-lg mb-2">{event.title}</h3>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-sm text-white/70">
                    <Calendar size={14} className="text-[#007AFF]" />
                    <span>{selectedFunction?.date || event.date}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-white/70">
                    <Clock size={14} className="text-[#FF9500]" />
                    <span>{selectedFunction?.time || event.time} hrs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-white/70">
                    <MapPin size={14} className="text-[#007AFF]" />
                    <span>{event.venue}, {event.city}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6 mb-6" data-testid="tickets-card">
            <div className="flex items-center space-x-2 mb-4">
              <Ticket size={18} className="text-[#007AFF]" />
              <h2 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Tus entradas
              </h2>
            </div>

            <div className="space-y-3">
              {isSeatedEvent ? (
                seats.map((seat, index) => (
                  <div key={seat.id || index} className="p-4 bg-[#1E1E1E] rounded-xl border border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">Asiento {seat.number || seat.seat}</p>
                        <p className="text-white/60 text-sm">{seat.section} - Fila {seat.row}</p>
                      </div>
                      <span className="text-[#FF9500] font-bold">{formatPrice(seat.price)}</span>
                    </div>
                  </div>
                ))
              ) : (
                tickets?.filter(t => t.quantity > 0).map((ticket, index) => (
                  <div key={ticket.id || index} className="p-4 bg-[#1E1E1E] rounded-xl border border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{ticket.type || ticket.name}</p>
                        <p className="text-white/60 text-sm">Cantidad: {ticket.quantity}</p>
                      </div>
                      <span className="text-[#FF9500] font-bold">{formatPrice(ticket.price * ticket.quantity)}</span>
                    </div>
                  </div>
                ))
              )}
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
          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6 mb-6" data-testid="buyer-card">
            <div className="flex items-center space-x-2 mb-4">
              <User size={18} className="text-[#007AFF]" />
              <h2 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Datos del comprador
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Nombre</p>
                <p className="text-white font-medium">{buyer.firstName} {buyer.lastName}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Email</p>
                <p className="text-white font-medium">{buyer.email}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Teléfono</p>
                <p className="text-white font-medium">{buyer.phone}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={handleDownloadTickets}
              className="w-full py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg flex items-center justify-center space-x-2"
              data-testid="download-tickets-button"
            >
              <Download size={18} />
              <span>Descargar entradas</span>
            </button>

            <div className="flex items-center justify-center space-x-2 text-white/60 text-sm">
              <Mail size={14} />
              <span>También enviamos las entradas a tu correo electrónico</span>
            </div>

            <button
              onClick={handleBackToHome}
              className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors text-sm"
              data-testid="back-to-home-button"
            >
              Volver al inicio
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ConfirmationPage;
