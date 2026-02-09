import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Calendar, Clock, MapPin, Ticket, AlertTriangle, ChevronLeft, CreditCard, Globe, Building2 } from 'lucide-react';

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

// Inline mock data to avoid babel plugin issues
const MOCK_EVENT_DATA = {
  '1': {
    id: '1',
    title: 'Festival Músical Verano 2025',
    type: 'general',
    date: '15 JUN 2025',
    time: '18:00',
    venue: 'Estadio Nacional',
    city: 'Ciudad de México',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1765278797923-10a027f5c69d?w=1200',
    selectedFunction: null,
    isMultiFunction: false
  },
  '2': {
    id: '2',
    title: 'Teatro: Noche de Gala',
    type: 'seated',
    date: '28 JUL 2025',
    time: '20:00',
    venue: 'Teatro Metropolitan',
    city: 'Ciudad de México',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1719650932800-ebb72adb2d2a?w=1200',
    selectedFunction: { date: '28 JUL 2025', time: '20:00' },
    isMultiFunction: true
  },
  '3': {
    id: '3',
    title: 'Concierto Internacional',
    type: 'general',
    date: '10 AGO 2025',
    time: '21:00',
    venue: 'Madison Square Garden',
    city: 'Nueva York',
    country: 'Estados Unidos',
    image: 'https://images.unsplash.com/photo-1765278797923-10a027f5c69d?w=1200',
    selectedFunction: null,
    isMultiFunction: false
  }
};

const PurchaseSummaryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Get event data with fallback
  const event = MOCK_EVENT_DATA[id] || MOCK_EVENT_DATA['1'];
  const isSeatedEvent = event.type === 'seated';
  
  // Get currency based on country
  const currency = CURRENCY_BY_COUNTRY[event.country] || CURRENCY_BY_COUNTRY['México'];

  // Mock purchase data based on event type
  const tickets = isSeatedEvent 
    ? [{ type: 'VIP', quantity: 1, price: 1499, section: 'Platea A', row: '5', seat: 'A12' }]
    : [
        { type: 'General', quantity: 2, price: 899, section: null, row: null, seat: null },
        { type: 'VIP', quantity: 1, price: 1499, section: null, row: null, seat: null }
      ];

  // Price calculations
  const subtotal = tickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);
  const serviceFee = 150;
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + serviceFee + tax;
  
  // Format price with currency symbol
  const formatPrice = (amount) => `${currency.symbol}${amount.toLocaleString()}`;

  const handleContinueToPayment = () => {
    alert('Redirigiendo al procesador de pagos...');
  };

  const handleGoBack = () => {
    navigate(`/evento/${id}`);
  };

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
                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Calendar size={14} className="text-[#007AFF] flex-shrink-0" />
                          <span data-testid="event-date">{event.date}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Clock size={14} className="text-[#FF9500] flex-shrink-0" />
                          <span data-testid="event-time">{event.time} hrs</span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Building2 size={14} className="text-[#007AFF] flex-shrink-0" />
                          <span data-testid="event-venue">{event.venue}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <MapPin size={14} className="text-[#FF9500] flex-shrink-0" />
                          <span data-testid="event-city">{event.city}, {event.country}</span>
                        </div>
                      </div>

                      {/* Selected Function - Only for multi-function events */}
                      {event.isMultiFunction && event.selectedFunction && (
                        <div className="pt-2 mt-2 border-t border-white/10">
                          <span className="text-xs text-white/50 uppercase tracking-wide">Función seleccionada</span>
                          <div className="text-sm text-white font-semibold" data-testid="selected-function">
                            {event.selectedFunction.date} - {event.selectedFunction.time} hrs
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
                  {tickets.map((ticket, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-[#1E1E1E] rounded-xl border border-white/5"
                      data-testid={`ticket-item-${index}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-white font-bold text-sm sm:text-base">{ticket.type}</h3>
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

                      {/* Seat info or Free Assignment */}
                      {isSeatedEvent && ticket.section ? (
                        <div className="pt-3 mt-3 border-t border-white/10">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-white/50 text-xs block">Sección</span>
                              <div className="text-white font-semibold text-sm">{ticket.section}</div>
                            </div>
                            <div>
                              <span className="text-white/50 text-xs block">Fila</span>
                              <div className="text-white font-semibold text-sm">{ticket.row}</div>
                            </div>
                            <div>
                              <span className="text-white/50 text-xs block">Asiento</span>
                              <div className="text-white font-semibold text-sm">{ticket.seat}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 mt-3 border-t border-white/10">
                          <span className="text-white/70 text-sm italic" data-testid="free-assignment">Libre asignación</span>
                        </div>
                      )}
                    </div>
                  ))}
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
                      {currency.code} ({currency.name})
                    </span>
                  </div>

                  {/* Price Items */}
                  <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Entradas</span>
                      <span className="text-white font-semibold" data-testid="subtotal-price">{formatPrice(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Cargo por servicio</span>
                      <span className="text-white font-semibold" data-testid="service-fee">{formatPrice(serviceFee)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">IVA (16%)</span>
                      <span className="text-white font-semibold" data-testid="tax-amount">{formatPrice(tax)}</span>
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
                            {formatPrice(total)}
                          </div>
                          <div className="text-white/50 text-xs mt-1" data-testid="currency-code">{currency.code}</div>
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
