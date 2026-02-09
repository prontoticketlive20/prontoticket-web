import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Calendar, Clock, MapPin, Ticket, AlertTriangle, ChevronLeft, CreditCard, Globe, Building2, ShoppingCart } from 'lucide-react';
import { usePurchase } from '../context/PurchaseContext';
import { mockEvents } from '../data/mockEvents';

const PurchaseSummaryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { 
    selectedEvent,
    selectedFunction,
    selectedTickets,
    selectedSeats,
    selectEvent,
    getPurchaseSummary,
    formatPrice
  } = usePurchase();

  // If no event in context, load from mock (fallback for direct URL access)
  useEffect(() => {
    if (!selectedEvent && id) {
      const event = mockEvents[id];
      if (event) {
        selectEvent(event);
      }
    }
  }, [id, selectedEvent, selectEvent]);

  // Get purchase summary from context
  const summary = getPurchaseSummary();
  
  // Use event from context or fallback to mock
  const event = selectedEvent || mockEvents[id] || mockEvents['1'];
  const isSeatedEvent = event?.type === 'seated';
  const hasMultipleFunctions = event?.functions && event.functions.length > 1;
  
  // Determine what to show based on event type
  const hasTicketSelections = selectedTickets && selectedTickets.length > 0;
  const hasSeatSelections = selectedSeats && selectedSeats.length > 0;
  const hasSelections = isSeatedEvent ? hasSeatSelections : hasTicketSelections;

  const handleContinueToPayment = () => {
    alert('Redirigiendo al procesador de pagos...');
  };

  const handleGoBack = () => {
    if (isSeatedEvent) {
      navigate(`/evento/${id}/asientos`);
    } else {
      navigate(`/evento/${id}`);
    }
  };

  // Empty state when no selections
  if (!hasSelections) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]" data-testid="purchase-summary-page">
        <Header />
        <div className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-white/40" />
              </div>
              <h2 
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                No hay selecciones
              </h2>
              <p className="text-white/60 mb-6">
                Parece que aún no has seleccionado entradas o asientos.
              </p>
              <button
                onClick={() => navigate(`/evento/${id}`)}
                className="px-6 py-3 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110"
                data-testid="go-to-event-button"
              >
                Ir al evento
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="purchase-summary-page">
      <Header />

      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Title */}
          <div className="mb-8">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}
              data-testid="page-title"
            >
              Resumen de Compra
            </h1>
            <p className="text-white/60 text-sm sm:text-base">Revisa los detalles antes de continuar</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Event Summary Card */}
              <div className="bg-[#121212] rounded-2xl border border-white/10 overflow-hidden" data-testid="event-summary-card">
                <div className="p-5 sm:p-6">
                  <h2 
                    className="text-lg sm:text-xl font-bold text-white mb-4 tracking-tight"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Evento
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <img 
                      src={event.image}
                      alt={event.title}
                      className="w-full sm:w-24 h-40 sm:h-24 rounded-xl object-cover flex-shrink-0"
                      data-testid="event-thumbnail"
                    />

                    <div className="flex-1 space-y-2">
                      <h3 className="text-white font-bold text-base sm:text-lg leading-tight" data-testid="event-title">
                        {event.title}
                      </h3>

                      <div className="space-y-1.5">
                        {/* Date */}
                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Calendar size={14} className="text-[#007AFF] flex-shrink-0" />
                          <span data-testid="event-date">
                            {selectedFunction?.date || event.date}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Clock size={14} className="text-[#FF9500] flex-shrink-0" />
                          <span data-testid="event-time">
                            {selectedFunction?.time || event.time} hrs
                          </span>
                        </div>

                        {/* Venue */}
                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Building2 size={14} className="text-[#007AFF] flex-shrink-0" />
                          <span data-testid="event-venue">{event.venue}</span>
                        </div>

                        {/* City & Country */}
                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <MapPin size={14} className="text-[#FF9500] flex-shrink-0" />
                          <span data-testid="event-city">{event.city}, {event.country}</span>
                        </div>
                      </div>

                      {/* Selected Function - Only for multi-function events */}
                      {hasMultipleFunctions && selectedFunction && (
                        <div className="pt-2 mt-2 border-t border-white/10">
                          <span className="text-xs text-white/50 uppercase tracking-wide">Función seleccionada</span>
                          <div className="text-sm text-white font-semibold" data-testid="selected-function">
                            {selectedFunction.date} - {selectedFunction.time} hrs
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Details Card */}
              <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6" data-testid="ticket-details-card">
                <h2 
                  className="text-lg sm:text-xl font-bold text-white mb-4 tracking-tight flex items-center space-x-2"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  <Ticket size={20} className="text-[#007AFF]" />
                  <span>Entradas</span>
                </h2>

                <div className="space-y-4">
                  {/* Show seats for seated events */}
                  {isSeatedEvent && hasSeatSelections ? (
                    selectedSeats.map((seat, index) => (
                      <div 
                        key={seat.id || index}
                        className="p-4 bg-[#1E1E1E] rounded-xl border border-white/5"
                        data-testid={`ticket-item-${index}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-white font-bold text-sm sm:text-base">
                              Asiento {seat.number || seat.seat}
                            </h3>
                            <p className="text-white/60 text-xs sm:text-sm">Cantidad: 1</p>
                          </div>
                          <div className="text-right">
                            <div className="text-[#FF9500] font-bold text-base sm:text-lg">
                              {formatPrice(seat.price)}
                            </div>
                          </div>
                        </div>

                        {/* Seat details */}
                        <div className="pt-3 mt-3 border-t border-white/10">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-white/50 text-xs block">Sección</span>
                              <div className="text-white font-semibold text-sm">{seat.section}</div>
                            </div>
                            <div>
                              <span className="text-white/50 text-xs block">Fila</span>
                              <div className="text-white font-semibold text-sm">{seat.row}</div>
                            </div>
                            <div>
                              <span className="text-white/50 text-xs block">Asiento</span>
                              <div className="text-white font-semibold text-sm">{seat.number || seat.seat}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Show tickets for general events */
                    selectedTickets.filter(t => t.quantity > 0).map((ticket, index) => (
                      <div 
                        key={ticket.id || index}
                        className="p-4 bg-[#1E1E1E] rounded-xl border border-white/5"
                        data-testid={`ticket-item-${index}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-white font-bold text-sm sm:text-base">{ticket.type || ticket.name}</h3>
                            <p className="text-white/60 text-xs sm:text-sm">Cantidad: {ticket.quantity}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-[#FF9500] font-bold text-base sm:text-lg">
                              {formatPrice(ticket.price * ticket.quantity)}
                            </div>
                            <div className="text-white/50 text-xs">
                              {formatPrice(ticket.price)} c/u
                            </div>
                          </div>
                        </div>

                        {/* Free assignment for general tickets */}
                        <div className="pt-3 mt-3 border-t border-white/10">
                          <span className="text-white/70 text-sm italic" data-testid="free-assignment">Libre asignación</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Policies Notice */}
              <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-2xl p-4 sm:p-5 flex items-start space-x-3" data-testid="policies-notice">
                <AlertTriangle size={20} className="text-[#FF9500] flex-shrink-0 mt-0.5" />
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  Las entradas no son reembolsables. Revisa cuidadosamente la información antes de continuar.
                </p>
              </div>

            </div>

            {/* Price Summary Sidebar - Right Column */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-32">
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6" data-testid="price-summary-card">
                  <h2 
                    className="text-lg sm:text-xl font-bold text-white mb-5 sm:mb-6 tracking-tight"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Desglose de precio
                  </h2>

                  {/* Currency Indicator */}
                  <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-white/10">
                    <Globe size={14} className="text-[#007AFF]" />
                    <span className="text-white/60 text-xs">Moneda:</span>
                    <span className="text-white text-xs font-semibold" data-testid="currency-indicator">
                      {summary.currency.code} ({summary.currency.name})
                    </span>
                  </div>

                  {/* Price Items */}
                  <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Entradas</span>
                      <span className="text-white font-semibold" data-testid="subtotal-price">
                        {formatPrice(summary.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Cargo por servicio</span>
                      <span className="text-white font-semibold" data-testid="service-fee">
                        {formatPrice(summary.serviceFee)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Impuestos ({Math.round(summary.taxRate * 100)}%)</span>
                      <span className="text-white font-semibold" data-testid="tax-amount">
                        {formatPrice(summary.tax)}
                      </span>
                    </div>

                    {/* Total - Emphasized */}
                    <div className="pt-4 mt-4 border-t border-white/10">
                      <div className="flex justify-between items-baseline">
                        <span className="text-white font-bold text-base sm:text-lg">Total</span>
                        <div className="text-right">
                          <div 
                            className="text-2xl sm:text-3xl font-bold text-[#FF9500] tracking-tight"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                            data-testid="total-price"
                          >
                            {formatPrice(summary.total)}
                          </div>
                          <div className="text-white/50 text-xs mt-1" data-testid="currency-code">
                            {summary.currency.code}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleContinueToPayment}
                      className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[#FF9500]/50 active:scale-95 flex items-center justify-center space-x-2 text-sm sm:text-base"
                      data-testid="continue-to-payment-button"
                    >
                      <CreditCard size={18} />
                      <span>Continuar al pago</span>
                    </button>

                    <button
                      onClick={handleGoBack}
                      className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors flex items-center justify-center space-x-2 text-sm"
                      data-testid="go-back-button"
                    >
                      <ChevronLeft size={16} />
                      <span>Volver y modificar selección</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PurchaseSummaryPage;
