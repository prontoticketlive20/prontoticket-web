import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { 
  Calendar, Clock, MapPin, Ticket, ChevronLeft, CreditCard, 
  Globe, Building2, User, Mail, Phone, AlertTriangle, Check,
  ShoppingCart
} from 'lucide-react';
import { usePurchase } from '../context/PurchaseContext';
import { mockEvents } from '../data/mockEvents';

// Mock user data - simulates logged in user
// In production, this would come from auth context/API
const MOCK_LOGGED_IN_USER = {
  id: 'user-123',
  firstName: 'Juan',
  lastName: 'García',
  email: 'juan.garcia@email.com',
  phone: '+52 55 1234 5678',
  isLoggedIn: true
};

// Set to false to test guest flow
const IS_USER_LOGGED_IN = true;

const CheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { 
    selectedEvent,
    selectedFunction,
    selectedTickets,
    selectedSeats,
    selectEvent,
    getPurchaseSummary,
    formatPrice,
    getStoredEventId
  } = usePurchase();

  // Form state - pre-filled if user is logged in
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Checkbox states
  const [purchaseAsGuest, setPurchaseAsGuest] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState({});
  
  // User state
  const [isLoggedIn] = useState(IS_USER_LOGGED_IN);
  const [currentUser] = useState(IS_USER_LOGGED_IN ? MOCK_LOGGED_IN_USER : null);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }
  }, [isLoggedIn, currentUser]);

  // Restore event from mock if needed
  useEffect(() => {
    const storedEventId = getStoredEventId();
    
    if (!selectedEvent && id) {
      const event = mockEvents[id];
      if (event) {
        selectEvent(event);
      }
    } else if (storedEventId && storedEventId !== id && !selectedEvent) {
      navigate(`/evento/${storedEventId}/checkout`, { replace: true });
    }
  }, [id, selectedEvent, selectEvent, getStoredEventId, navigate]);

  // Get purchase summary
  const summary = getPurchaseSummary();
  const event = selectedEvent || mockEvents[id] || mockEvents['1'];
  const isSeatedEvent = event?.saleType === 'seated';
  const hasMultipleFunctions = event?.functions && event.functions.length > 1;

  // Check if has selections
  const hasTicketSelections = selectedTickets && selectedTickets.length > 0;
  const hasSeatSelections = selectedSeats && selectedSeats.length > 0;
  const hasSelections = isSeatedEvent ? hasSeatSelections : hasTicketSelections;

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment submission
  const handleProceedToPayment = () => {
    if (!acceptTerms) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    // In production, this would submit to payment gateway
    alert(`Procesando pago para: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}`);
  };

  // Go back to summary
  const handleGoBack = () => {
    navigate(`/evento/${id}/resumen`);
  };

  // Check if can proceed to payment
  const canProceedToPayment = acceptTerms && hasSelections;

  // Empty state - no selections
  if (!hasSelections) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]" data-testid="checkout-page">
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
                No tienes entradas seleccionadas para comprar.
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
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="checkout-page">
      <Header />

      <div className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Title */}
          <div className="mb-8">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}
              data-testid="page-title"
            >
              Checkout
            </h1>
            <p className="text-white/60 text-sm sm:text-base">Completa tus datos para finalizar la compra</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* LEFT COLUMN - Buyer Information (3/5) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Buyer Information Card */}
              <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6" data-testid="buyer-info-card">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                    <User size={20} className="text-[#007AFF]" />
                  </div>
                  <div>
                    <h2 
                      className="text-lg sm:text-xl font-bold text-white tracking-tight"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Información del comprador
                    </h2>
                    {isLoggedIn && (
                      <p className="text-white/50 text-xs">
                        Sesión iniciada como {currentUser?.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* First Name & Last Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-white/70 text-sm mb-2" htmlFor="firstName">
                        Nombre <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Ingresa tu nombre"
                        className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all ${
                          errors.firstName ? 'border-red-500' : 'border-white/10'
                        }`}
                        data-testid="input-first-name"
                      />
                      {errors.firstName && (
                        <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-white/70 text-sm mb-2" htmlFor="lastName">
                        Apellido <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Ingresa tu apellido"
                        className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all ${
                          errors.lastName ? 'border-red-500' : 'border-white/10'
                        }`}
                        data-testid="input-last-name"
                      />
                      {errors.lastName && (
                        <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2" htmlFor="email">
                      <Mail size={14} className="inline mr-1" />
                      Correo electrónico <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                      className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all ${
                        errors.email ? 'border-red-500' : 'border-white/10'
                      }`}
                      data-testid="input-email"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2" htmlFor="phone">
                      <Phone size={14} className="inline mr-1" />
                      Teléfono <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+52 55 1234 5678"
                      className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all ${
                        errors.phone ? 'border-red-500' : 'border-white/10'
                      }`}
                      data-testid="input-phone"
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  {/* Purchase as Guest - Only show if NOT logged in */}
                  {!isLoggedIn && (
                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={purchaseAsGuest}
                          onChange={(e) => setPurchaseAsGuest(e.target.checked)}
                          className="sr-only"
                          data-testid="checkbox-guest"
                        />
                        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                          purchaseAsGuest 
                            ? 'bg-[#007AFF] border-[#007AFF]' 
                            : 'border-white/30 group-hover:border-white/50'
                        }`}>
                          {purchaseAsGuest && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-white/70 text-sm">
                        Comprar como invitado (sin crear cuenta)
                      </span>
                    </label>
                  )}

                  {/* Accept Terms - MANDATORY */}
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="sr-only"
                        data-testid="checkbox-terms"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                        acceptTerms 
                          ? 'bg-[#007AFF] border-[#007AFF]' 
                          : 'border-white/30 group-hover:border-white/50'
                      }`}>
                        {acceptTerms && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-white/70 text-sm">
                      Acepto los{' '}
                      <a href="#" className="text-[#007AFF] hover:underline">Términos y Condiciones</a>
                      {' '}y la{' '}
                      <a href="#" className="text-[#007AFF] hover:underline">Política de Privacidad</a>
                      {' '}<span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>

                {/* Terms Warning if not accepted */}
                {!acceptTerms && (
                  <div className="mt-4 p-3 bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-xl flex items-center space-x-2">
                    <AlertTriangle size={16} className="text-[#FF9500] flex-shrink-0" />
                    <p className="text-white/70 text-xs">
                      Debes aceptar los términos y condiciones para continuar
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN - Order Summary (2/5) */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-32 space-y-6">
                
                {/* Event Summary Card */}
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5" data-testid="event-summary-card">
                  <h3 
                    className="text-base font-bold text-white mb-4 tracking-tight"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Evento
                  </h3>

                  <div className="flex gap-3">
                    <img 
                      src={event.image}
                      alt={event.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                        {event.title}
                      </h4>
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-xs text-white/60">
                          <Calendar size={12} className="text-[#007AFF]" />
                          <span>{selectedFunction?.date || event.date}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-white/60">
                          <Clock size={12} className="text-[#FF9500]" />
                          <span>{selectedFunction?.time || event.time} hrs</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-white/60">
                          <MapPin size={12} className="text-[#007AFF]" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Function Badge */}
                  {hasMultipleFunctions && selectedFunction && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-white/50 text-xs">Función: </span>
                      <span className="text-[#007AFF] text-xs font-semibold">
                        {selectedFunction.date} - {selectedFunction.time}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tickets Summary */}
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5" data-testid="tickets-summary-card">
                  <div className="flex items-center space-x-2 mb-4">
                    <Ticket size={16} className="text-[#007AFF]" />
                    <h3 
                      className="text-base font-bold text-white tracking-tight"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Entradas
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {isSeatedEvent ? (
                      selectedSeats.map((seat, index) => (
                        <div key={seat.id || index} className="flex justify-between text-sm">
                          <span className="text-white/70">
                            {seat.section} - {seat.row}{seat.number || seat.seat}
                          </span>
                          <span className="text-white font-semibold">{formatPrice(seat.price)}</span>
                        </div>
                      ))
                    ) : (
                      selectedTickets.filter(t => t.quantity > 0).map((ticket, index) => (
                        <div key={ticket.id || index} className="flex justify-between text-sm">
                          <span className="text-white/70">
                            {ticket.type || ticket.name} x{ticket.quantity}
                          </span>
                          <span className="text-white font-semibold">
                            {formatPrice(ticket.price * ticket.quantity)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5" data-testid="price-summary-card">
                  <h3 
                    className="text-base font-bold text-white mb-4 tracking-tight"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Resumen
                  </h3>

                  {/* Currency */}
                  <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-white/10">
                    <Globe size={12} className="text-[#007AFF]" />
                    <span className="text-white/50 text-xs">
                      {summary.currency.code} ({summary.currency.name})
                    </span>
                  </div>

                  {/* Price Items */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Subtotal</span>
                      <span className="text-white">{formatPrice(summary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Cargo por servicio</span>
                      <span className="text-white">{formatPrice(summary.serviceFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Impuestos ({Math.round(summary.taxRate * 100)}%)</span>
                      <span className="text-white">{formatPrice(summary.tax)}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-baseline">
                      <span className="text-white font-bold">Total</span>
                      <div className="text-right">
                        <div 
                          className="text-2xl font-bold text-[#FF9500]"
                          style={{ fontFamily: "'Outfit', sans-serif" }}
                          data-testid="total-price"
                        >
                          {formatPrice(summary.total)}
                        </div>
                        <div className="text-white/40 text-xs">{summary.currency.code}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleProceedToPayment}
                    disabled={!canProceedToPayment}
                    className="w-full py-4 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[#FF9500]/50 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                    data-testid="proceed-to-payment-button"
                  >
                    <CreditCard size={18} />
                    <span>Proceder al pago</span>
                  </button>

                  <button
                    onClick={handleGoBack}
                    className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors flex items-center justify-center space-x-2 text-sm"
                    data-testid="go-back-button"
                  >
                    <ChevronLeft size={16} />
                    <span>Volver al resumen</span>
                  </button>
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

export default CheckoutPage;
