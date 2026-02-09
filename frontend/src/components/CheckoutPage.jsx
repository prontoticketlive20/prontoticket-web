import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { 
  Calendar, Clock, MapPin, Ticket, ChevronLeft, CreditCard, 
  Globe, Building2, User, Mail, Phone, AlertTriangle, Check,
  ShoppingCart, Lock, Loader2, Apple, Wallet
} from 'lucide-react';
import { usePurchase } from '../context/PurchaseContext';
import { mockEvents } from '../data/mockEvents';

// Mock user data - simulates logged in user
const MOCK_LOGGED_IN_USER = {
  id: 'user-123',
  firstName: 'Juan',
  lastName: 'García',
  email: 'juan.garcia@email.com',
  phone: '+52 55 1234 5678',
  isLoggedIn: true
};

const IS_USER_LOGGED_IN = true;

// Stripe Payment Element Mock Component
// This simulates Stripe Payment Element UI for development
// Will be replaced with actual @stripe/react-stripe-js when API keys are configured
const MockStripePaymentElement = ({ onReady, onError, disabled }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardError, setCardError] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Simulate Stripe Element becoming ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      onReady?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [onReady]);

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  // Format expiry date
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + ' / ' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
      setCardError('');
    }
  };

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\s+/g, '').replace(/\//g, '');
    if (raw.length <= 4) {
      setExpiry(formatExpiry(raw));
    }
  };

  const handleCvcChange = (e) => {
    const v = e.target.value.replace(/[^0-9]/gi, '');
    if (v.length <= 4) {
      setCvc(v);
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#007AFF] animate-spin" />
        <span className="ml-2 text-white/60 text-sm">Cargando métodos de pago...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Payment Method Tabs - Simulating Stripe's automatic display */}
      <div className="flex space-x-2 mb-4">
        <button 
          className="flex-1 py-2.5 px-4 bg-[#007AFF]/10 border-2 border-[#007AFF] rounded-lg flex items-center justify-center space-x-2 text-white text-sm font-medium"
          disabled={disabled}
        >
          <CreditCard size={16} />
          <span>Tarjeta</span>
        </button>
        <button 
          className="flex-1 py-2.5 px-4 bg-[#1E1E1E] border border-white/10 rounded-lg flex items-center justify-center space-x-2 text-white/60 text-sm hover:border-white/20 transition-colors"
          disabled={disabled}
          title="Apple Pay disponible en dispositivos compatibles"
        >
          <Apple size={16} />
          <span>Apple Pay</span>
        </button>
        <button 
          className="flex-1 py-2.5 px-4 bg-[#1E1E1E] border border-white/10 rounded-lg flex items-center justify-center space-x-2 text-white/60 text-sm hover:border-white/20 transition-colors"
          disabled={disabled}
          title="Otros métodos según país"
        >
          <Wallet size={16} />
          <span>Más</span>
        </button>
      </div>

      {/* Card Input Fields */}
      <div className="space-y-3">
        {/* Card Number */}
        <div>
          <label className="block text-white/60 text-xs mb-1.5">Número de tarjeta</label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardChange}
              placeholder="1234 5678 9012 3456"
              disabled={disabled}
              className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all font-mono"
              data-testid="stripe-card-number"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
              <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-5" />
              <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-5" />
              <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-5" />
            </div>
          </div>
        </div>

        {/* Expiry & CVC Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-white/60 text-xs mb-1.5">Vencimiento</label>
            <input
              type="text"
              value={expiry}
              onChange={handleExpiryChange}
              placeholder="MM / AA"
              disabled={disabled}
              className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all font-mono"
              data-testid="stripe-expiry"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs mb-1.5">CVC</label>
            <input
              type="text"
              value={cvc}
              onChange={handleCvcChange}
              placeholder="123"
              disabled={disabled}
              className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all font-mono"
              data-testid="stripe-cvc"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {cardError && (
        <div className="flex items-center space-x-2 text-red-400 text-sm">
          <AlertTriangle size={14} />
          <span>{cardError}</span>
        </div>
      )}

      {/* Stripe Branding */}
      <div className="flex items-center justify-center space-x-1 pt-2">
        <Lock size={12} className="text-white/40" />
        <span className="text-white/40 text-xs">Pago seguro con</span>
        <svg className="h-4" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M59.64 14.28H56.55V7.13H59.64V14.28ZM53.65 7.13V8.61C52.9 7.44 51.72 6.9 50.36 6.9C47.62 6.9 45.37 9.24 45.37 12.16C45.37 15.08 47.62 17.42 50.36 17.42C51.72 17.42 52.9 16.88 53.65 15.71V17.19H56.55V7.13H53.65ZM51 14.62C49.66 14.62 48.52 13.56 48.52 12.16C48.52 10.76 49.66 9.7 51 9.7C52.35 9.7 53.49 10.76 53.49 12.16C53.49 13.56 52.35 14.62 51 14.62ZM42.65 6.9C41.32 6.9 40.29 7.45 39.65 8.33V7.13H36.76V17.19H39.85V11.52C39.85 10.19 40.75 9.5 41.84 9.5C43.02 9.5 43.72 10.19 43.72 11.47V17.19H46.81V10.85C46.81 8.49 45.26 6.9 42.65 6.9ZM32.95 7.13L30.62 13.89L28.21 7.13H24.87L28.95 17.19H32.12L36.26 7.13H32.95ZM21.58 14.62C20.24 14.62 19.1 13.56 19.1 12.16C19.1 10.76 20.24 9.7 21.58 9.7C22.93 9.7 24.07 10.76 24.07 12.16C24.07 13.56 22.93 14.62 21.58 14.62ZM24.23 7.13V8.61C23.48 7.44 22.3 6.9 20.94 6.9C18.2 6.9 15.95 9.24 15.95 12.16C15.95 15.08 18.2 17.42 20.94 17.42C22.3 17.42 23.48 16.88 24.23 15.71V17.19H27.12V7.13H24.23ZM11.38 17.42C13.92 17.42 15.47 16.21 15.47 14.12C15.47 10.04 9.38 11.3 9.38 9.66C9.38 9.18 9.85 8.76 10.88 8.76C11.97 8.76 13.18 9.21 14.17 9.88L15.14 7.59C14.04 6.84 12.39 6.45 10.89 6.45C8.44 6.45 6.66 7.72 6.66 9.79C6.66 13.84 12.75 12.58 12.75 14.25C12.75 14.79 12.2 15.11 11.21 15.11C9.86 15.11 8.4 14.52 7.39 13.73L6.37 16.02C7.53 16.93 9.49 17.42 11.38 17.42ZM3.08 4.51C3.08 3.45 2.2 2.59 1.09 2.59C-0.03 2.59 -0.9 3.45 -0.9 4.51C-0.9 5.57 -0.03 6.43 1.09 6.43C2.2 6.43 3.08 5.57 3.08 4.51ZM-0.4 17.19H2.69V7.13H-0.4V17.19Z" fill="#6772E5"/>
        </svg>
      </div>
    </div>
  );
};

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
    getStoredEventId,
    clearPurchase
  } = usePurchase();

  // Form state
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

  // Payment state
  const [stripeReady, setStripeReady] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [checkoutLocked, setCheckoutLocked] = useState(false);

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

  // Handle Stripe ready
  const handleStripeReady = useCallback(() => {
    setStripeReady(true);
  }, []);

  // Handle Stripe error
  const handleStripeError = useCallback((error) => {
    setPaymentError(error);
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
  const handlePayNow = async () => {
    // Prevent double submission
    if (isProcessingPayment || checkoutLocked) {
      return;
    }

    // Validate terms
    if (!acceptTerms) {
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Clear previous errors
    setPaymentError('');
    setIsProcessingPayment(true);

    try {
      // Simulate Stripe payment processing
      // In production, this would call stripe.confirmPayment()
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment (90% success rate for demo)
      const isSuccess = Math.random() > 0.1;

      if (!isSuccess) {
        throw new Error('Tu tarjeta fue rechazada. Por favor, verifica los datos o intenta con otra tarjeta.');
      }

      // Lock checkout state on success
      setCheckoutLocked(true);

      // Prepare confirmation data
      const confirmationData = {
        orderId: `ORD-${Date.now()}`,
        event: {
          id: event.id,
          title: event.title,
          date: selectedFunction?.date || event.date,
          time: selectedFunction?.time || event.time,
          venue: event.venue,
          city: event.city
        },
        selectedFunction,
        tickets: selectedTickets,
        seats: selectedSeats,
        buyer: formData,
        total: summary.total,
        currency: summary.currency,
        paymentMethod: 'card',
        timestamp: new Date().toISOString()
      };

      // Store confirmation data in sessionStorage for confirmation page
      sessionStorage.setItem('prontoticket_confirmation', JSON.stringify(confirmationData));

      // Navigate to confirmation page
      navigate(`/evento/${id}/confirmacion`);

    } catch (error) {
      setPaymentError(error.message || 'Error al procesar el pago. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Go back to summary
  const handleGoBack = () => {
    navigate(`/evento/${id}/resumen`);
  };

  // Check if can proceed to payment
  const canPayNow = acceptTerms && stripeReady && hasSelections && !isProcessingPayment && !checkoutLocked;

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
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                No hay selecciones
              </h2>
              <p className="text-white/60 mb-6">No tienes entradas seleccionadas para comprar.</p>
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
            <p className="text-white/60 text-sm sm:text-base">Completa tus datos y realiza el pago</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* LEFT COLUMN - Buyer Info & Payment (3/5) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Buyer Information Card */}
              <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6" data-testid="buyer-info-card">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                    <User size={20} className="text-[#007AFF]" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      Información del comprador
                    </h2>
                    {isLoggedIn && (
                      <p className="text-white/50 text-xs">Sesión iniciada como {currentUser?.email}</p>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        disabled={checkoutLocked}
                        className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${errors.firstName ? 'border-red-500' : 'border-white/10'}`}
                        data-testid="input-first-name"
                      />
                      {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                    </div>
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
                        disabled={checkoutLocked}
                        className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${errors.lastName ? 'border-red-500' : 'border-white/10'}`}
                        data-testid="input-last-name"
                      />
                      {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

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
                      disabled={checkoutLocked}
                      className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${errors.email ? 'border-red-500' : 'border-white/10'}`}
                      data-testid="input-email"
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>

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
                      disabled={checkoutLocked}
                      className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${errors.phone ? 'border-red-500' : 'border-white/10'}`}
                      data-testid="input-phone"
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  {!isLoggedIn && (
                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={purchaseAsGuest}
                          onChange={(e) => setPurchaseAsGuest(e.target.checked)}
                          disabled={checkoutLocked}
                          className="sr-only"
                          data-testid="checkbox-guest"
                        />
                        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${purchaseAsGuest ? 'bg-[#007AFF] border-[#007AFF]' : 'border-white/30 group-hover:border-white/50'}`}>
                          {purchaseAsGuest && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-white/70 text-sm">Comprar como invitado (sin crear cuenta)</span>
                    </label>
                  )}

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        disabled={checkoutLocked}
                        className="sr-only"
                        data-testid="checkbox-terms"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${acceptTerms ? 'bg-[#007AFF] border-[#007AFF]' : 'border-white/30 group-hover:border-white/50'}`}>
                        {acceptTerms && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-white/70 text-sm">
                      Acepto los <a href="#" className="text-[#007AFF] hover:underline">Términos y Condiciones</a> y la <a href="#" className="text-[#007AFF] hover:underline">Política de Privacidad</a> <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Payment Section - NEW */}
              <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6" data-testid="payment-section">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#FF9500]/10 flex items-center justify-center">
                    <CreditCard size={20} className="text-[#FF9500]" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      Pago
                    </h2>
                    <p className="text-white/50 text-xs">Selecciona tu método de pago</p>
                  </div>
                </div>

                {/* Stripe Payment Element */}
                <MockStripePaymentElement 
                  onReady={handleStripeReady}
                  onError={handleStripeError}
                  disabled={checkoutLocked || !acceptTerms}
                />

                {/* Payment Error Message */}
                {paymentError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3" data-testid="payment-error">
                    <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-semibold text-sm">Error en el pago</p>
                      <p className="text-red-300/80 text-sm mt-1">{paymentError}</p>
                    </div>
                  </div>
                )}

                {/* Terms Warning */}
                {!acceptTerms && (
                  <div className="mt-4 p-3 bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-xl flex items-center space-x-2">
                    <AlertTriangle size={16} className="text-[#FF9500] flex-shrink-0" />
                    <p className="text-white/70 text-xs">Acepta los términos y condiciones para continuar con el pago</p>
                  </div>
                )}

                {/* Pay Now Button */}
                <button
                  onClick={handlePayNow}
                  disabled={!canPayNow}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[#FF9500]/50 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                  data-testid="pay-now-button"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Procesando pago...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>Pagar {formatPrice(summary.total)}</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN - Order Summary (2/5) */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-32 space-y-6">
                
                {/* Event Summary Card */}
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5" data-testid="event-summary-card">
                  <h3 className="text-base font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Evento
                  </h3>
                  <div className="flex gap-3">
                    <img src={event.image} alt={event.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2">{event.title}</h4>
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
                  {hasMultipleFunctions && selectedFunction && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-white/50 text-xs">Función: </span>
                      <span className="text-[#007AFF] text-xs font-semibold">{selectedFunction.date} - {selectedFunction.time}</span>
                    </div>
                  )}
                </div>

                {/* Tickets Summary */}
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5" data-testid="tickets-summary-card">
                  <div className="flex items-center space-x-2 mb-4">
                    <Ticket size={16} className="text-[#007AFF]" />
                    <h3 className="text-base font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      Entradas
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {isSeatedEvent ? (
                      selectedSeats.map((seat, index) => (
                        <div key={seat.id || index} className="flex justify-between text-sm">
                          <span className="text-white/70">{seat.section} - {seat.row}{seat.number || seat.seat}</span>
                          <span className="text-white font-semibold">{formatPrice(seat.price)}</span>
                        </div>
                      ))
                    ) : (
                      selectedTickets.filter(t => t.quantity > 0).map((ticket, index) => (
                        <div key={ticket.id || index} className="flex justify-between text-sm">
                          <span className="text-white/70">{ticket.type || ticket.name} x{ticket.quantity}</span>
                          <span className="text-white font-semibold">{formatPrice(ticket.price * ticket.quantity)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5" data-testid="price-summary-card">
                  <h3 className="text-base font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Resumen
                  </h3>
                  <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-white/10">
                    <Globe size={12} className="text-[#007AFF]" />
                    <span className="text-white/50 text-xs">{summary.currency.code} ({summary.currency.name})</span>
                  </div>
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
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-baseline">
                      <span className="text-white font-bold">Total</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#FF9500]" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="total-price">
                          {formatPrice(summary.total)}
                        </div>
                        <div className="text-white/40 text-xs">{summary.currency.code}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <button
                  onClick={handleGoBack}
                  disabled={isProcessingPayment}
                  className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
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

      <Footer />
    </div>
  );
};

export default CheckoutPage;
