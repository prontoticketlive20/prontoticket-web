import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Calendar, Clock, MapPin, Ticket, AlertTriangle, ChevronLeft, CreditCard } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';

const PurchaseSummaryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = mockEvents[id] || mockEvents['1'];

  // Mock purchase data (en producción vendría del estado global o API)
  const purchaseData = {
    selectedFunction: event.functions && event.functions.length > 1 ? event.functions[1] : null,
    tickets: [
      { type: 'General', quantity: 2, price: 899, seat: null },
      { type: 'VIP', quantity: 1, price: 1499, seat: { section: 'Platea A', row: '5', number: 'A12' } }
    ],
    hasSeating: event.type === 'seated'
  };

  const subtotal = purchaseData.tickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0);
  const serviceFee = 150;
  const tax = Math.round(subtotal * 0.16); // 16% IVA
  const total = subtotal + serviceFee + tax;

  const handleContinueToPayment = () => {
    alert('Redirigiendo al procesador de pagos...');
  };

  const handleGoBack = () => {
    navigate(`/evento/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Title */}
          <div className="mb-8">
            <h1 
              className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Resumen de Compra
            </h1>
            <p className="text-white/60">Revisa los detalles antes de continuar</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Event Summary */}
              <div className="bg-[#121212] rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6">
                  <h2 
                    className="text-xl font-bold text-white mb-4 tracking-tight"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Evento
                  </h2>

                  <div className="flex gap-4">
                    {/* Event Thumbnail */}
                    <img 
                      src={event.image}
                      alt={event.title}
                      className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                    />

                    {/* Event Info */}
                    <div className="flex-1 space-y-2">
                      <h3 className="text-white font-bold text-lg leading-tight">
                        {event.title}
                      </h3>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Calendar size={14} className="text-[#007AFF]" />
                          <span>{event.date}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Clock size={14} className="text-[#FF9500]" />
                          <span>{event.time} hrs</span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <MapPin size={14} className="text-[#007AFF]" />
                          <span>{event.venue}</span>
                        </div>
                      </div>

                      {purchaseData.selectedFunction && (
                        <div className="pt-2 mt-2 border-t border-white/10">
                          <span className="text-xs text-white/50 uppercase tracking-wide">Función seleccionada</span>
                          <div className="text-sm text-white font-semibold">
                            {purchaseData.selectedFunction.date} - {purchaseData.selectedFunction.time} hrs
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="bg-[#121212] rounded-2xl border border-white/10 p-6">
                <h2 
                  className="text-xl font-bold text-white mb-4 tracking-tight flex items-center space-x-2"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  <Ticket size={22} className="text-[#007AFF]" />
                  <span>Entradas</span>
                </h2>

                <div className="space-y-4">
                  {purchaseData.tickets.map((ticket, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-[#1E1E1E] rounded-xl border border-white/5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-white font-bold">{ticket.type}</h3>
                          <p className="text-white/60 text-sm">Cantidad: {ticket.quantity}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-[#FF9500] font-bold text-lg">
                            ${ticket.price * ticket.quantity}
                          </div>
                          <div className="text-white/50 text-xs">
                            ${ticket.price} c/u
                          </div>
                        </div>
                      </div>

                      {/* Seat Info */}
                      {purchaseData.hasSeating ? (
                        ticket.seat ? (
                          <div className="pt-3 mt-3 border-t border-white/10">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-white/50 text-xs">Sección</span>
                                <div className="text-white font-semibold">{ticket.seat.section}</div>
                              </div>
                              <div>
                                <span className="text-white/50 text-xs">Fila</span>
                                <div className="text-white font-semibold">{ticket.seat.row}</div>
                              </div>
                              <div>
                                <span className="text-white/50 text-xs">Asiento</span>
                                <div className="text-white font-semibold">{ticket.seat.number}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-3 mt-3 border-t border-white/10">
                            <span className="text-white/70 text-sm italic">Libre asignación</span>
                          </div>
                        )
                      ) : (
                        <div className="pt-3 mt-3 border-t border-white/10">
                          <span className="text-white/70 text-sm italic">Libre asignación</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies Notice */}
              <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-2xl p-5 flex items-start space-x-3">
                <AlertTriangle size={20} className="text-[#FF9500] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Las entradas no son reembolsables. Revisa cuidadosamente la información antes de continuar.
                  </p>
                </div>
              </div>

            </div>

            {/* Price Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-6">
                  <h2 
                    className="text-xl font-bold text-white mb-6 tracking-tight"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Desglose de precio
                  </h2>

                  {/* Price Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Entradas</span>
                      <span className="text-white font-semibold">${subtotal}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Cargo por servicio</span>
                      <span className="text-white font-semibold">${serviceFee}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">IVA (16%)</span>
                      <span className="text-white font-semibold">${tax}</span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                      <div className="flex justify-between items-baseline">
                        <span className="text-white font-bold text-lg">Total</span>
                        <div className="text-right">
                          <div 
                            className="text-3xl font-bold text-[#FF9500] tracking-tight"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                          >
                            ${total}
                          </div>
                          <div className="text-white/50 text-xs mt-1">MXN</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handleContinueToPayment}
                      className="w-full py-4 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[#FF9500]/50 active:scale-95 flex items-center justify-center space-x-2"
                      data-testid="continue-to-payment-button"
                    >
                      <CreditCard size={20} />
                      <span>Continuar al pago</span>
                    </button>

                    <button
                      onClick={handleGoBack}
                      className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors flex items-center justify-center space-x-2"
                      data-testid="go-back-button"
                    >
                      <ChevronLeft size={18} />
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
