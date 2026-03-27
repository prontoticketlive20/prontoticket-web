import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  CreditCard,
  User,
  Mail,
  Phone,
  AlertTriangle,
  Check,
  ShoppingCart,
  Lock,
  Loader2,
  Apple,
  Wallet
} from 'lucide-react';
import { usePurchase } from '../context/PurchaseContext';
import { createGuestOrder } from '../services/orders.service';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import api from '../api/api';

const SEATSIO_SESSION_STORAGE_KEY = 'prontoticket_seatsio_session';

const stripePromise = loadStripe(getStripePublishableKey());

const getStripePublishableKey = () => {
  return process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
};

const cardElementOptions = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: 'rgba(255,255,255,0.3)',
      },
      iconColor: '#007AFF',
    },
    invalid: {
      color: '#f87171',
      iconColor: '#f87171',
    },
  },
  hidePostalCode: true,
};

const getStoredSeatsioSession = () => {
  try {
    const raw = sessionStorage.getItem(SEATSIO_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const splitFullName = (fullName = '') => {
  const clean = String(fullName || '').trim();
  if (!clean) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: '',
    };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  };
};

const StripeCardSection = ({ disabled, onReady, onError }) => {
  const [isReady, setIsReady] = useState(false);

  const handleReady = () => {
    setIsReady(true);
    onReady?.();
  };

  const handleChange = (event) => {
    if (event.error) {
      onError?.(event.error.message);
    } else {
      onError?.('');
    }
  };

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex space-x-2 mb-4">
        <button
          className="flex-1 py-2.5 px-4 bg-[#007AFF]/10 border-2 border-[#007AFF] rounded-lg flex items-center justify-center space-x-2 text-white text-sm font-medium"
          disabled
          type="button"
        >
          <CreditCard size={16} />
          <span>Tarjeta</span>
        </button>

        <button
          className="flex-1 py-2.5 px-4 bg-[#1E1E1E] border border-white/10 rounded-lg flex items-center justify-center space-x-2 text-white/60 text-sm"
          disabled
          type="button"
          title="Apple Pay disponible luego según configuración Stripe y dispositivo"
        >
          <Apple size={16} />
          <span>Apple Pay</span>
        </button>

        <button
          className="flex-1 py-2.5 px-4 bg-[#1E1E1E] border border-white/10 rounded-lg flex items-center justify-center space-x-2 text-white/60 text-sm"
          disabled
          type="button"
          title="Otros métodos según país"
        >
          <Wallet size={16} />
          <span>Más</span>
        </button>
      </div>

      {!isReady && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-[#007AFF] animate-spin" />
          <span className="ml-2 text-white/60 text-sm">Cargando Stripe...</span>
        </div>
      )}

      <div>
        <label className="block text-white/60 text-xs mb-1.5">
          Datos de tarjeta
        </label>

        <div className="px-4 py-4 bg-[#1E1E1E] border border-white/10 rounded-lg focus-within:ring-2 focus-within:ring-[#007AFF] transition-all">
          <CardElement
            options={cardElementOptions}
            onReady={handleReady}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex items-center justify-center space-x-1 pt-2">
        <Lock size={12} className="text-white/40" />
        <span className="text-white/40 text-xs">Pago seguro con</span>
        <span className="text-white/40 text-xs font-bold">Stripe</span>
      </div>
    </div>
  );
};

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const { id } = useParams();
  const navigate = useNavigate();

  const {
    selectedEvent,
    selectedFunction,
    selectedTickets,
    selectedSeats,
    getPurchaseSummary,
    formatPrice,
    clearPurchase,
    expirePurchase,
    purchaseTimer,
    timerLabel
  } = usePurchase();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [purchaseAsGuest, setPurchaseAsGuest] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [stripeReady, setStripeReady] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [checkoutLocked, setCheckoutLocked] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadCurrentUser = async () => {
      try {
        const token =
          localStorage.getItem('ptl_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('pt_token');

        if (!token) {
          if (!alive) return;
          setIsLoggedIn(false);
          setCurrentUser(null);
          return;
        }

        const res = await api.get('/auth/me');
        const me = res.data?.data ?? res.data;

        if (!alive) return;

        const userId = me?.userId || me?.id || null;
        const email = me?.email || '';
        const name = me?.name || '';

        const parts = splitFullName(name);

        setCurrentUser({
          id: userId,
          name,
          firstName: parts.firstName,
          lastName: parts.lastName,
          email,
          phone: '',
          role: me?.role || null,
          isLoggedIn: true,
        });

        setIsLoggedIn(true);
      } catch {
        if (!alive) return;
        setIsLoggedIn(false);
        setCurrentUser(null);
      } finally {
        if (alive) setAuthLoading(false);
      }
    };

    loadCurrentUser();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || currentUser.firstName || '',
        lastName: prev.lastName || currentUser.lastName || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || currentUser.phone || ''
      }));
    }
  }, [isLoggedIn, currentUser]);

  const summary = getPurchaseSummary();
  const event = selectedEvent;
  const isSeatedEvent = event?.saleType === 'seated';
  const hasMultipleFunctions = event?.functions && event.functions.length > 1;

  const hasTicketSelections = selectedTickets && selectedTickets.some(t => (t.quantity || 0) > 0);
  const hasSeatSelections = selectedSeats && selectedSeats.length > 0;
  const hasSelections = isSeatedEvent ? hasSeatSelections : hasTicketSelections;

  const isTimerBlocking = purchaseTimer?.mode === event?.saleType && !purchaseTimer?.isActive;
  const showTimer = purchaseTimer?.mode === event?.saleType && (purchaseTimer?.isActive || purchaseTimer?.isExpired);

  useEffect(() => {
    if (purchaseTimer?.isExpired && hasSelections) {
      expirePurchase();

      const timeout = setTimeout(() => {
        if (isSeatedEvent) {
          navigate(`/evento/${id}/asientos`, { replace: true });
        } else {
          navigate(`/evento/${id}`, { replace: true });
        }
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [purchaseTimer?.isExpired, hasSelections, expirePurchase, isSeatedEvent, navigate, id]);

  const handleStripeReady = useCallback(() => setStripeReady(true), []);
  const handleStripeError = useCallback((error) => setPaymentError(error || ''), []);

  const timerMessage = useMemo(() => {
    if (purchaseTimer?.isExpired) {
      return 'Tu tiempo de compra expiró. Debes volver a seleccionar tus entradas.';
    }
    if (purchaseTimer?.isWarning) {
      return 'Tu reserva está por expirar. Finaliza el pago antes de que se liberen tus entradas.';
    }
    return null;
  }, [purchaseTimer?.isExpired, purchaseTimer?.isWarning]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildGuestItems = () => {
  if (!isSeatedEvent) {
    return (selectedTickets || [])
      .filter((t) => Number(t.quantity || 0) > 0)
      .map((t) => ({
        ticketTypeId: t.id,
        quantity: Number(t.quantity || 0),
      }));
  }

  return (selectedSeats || [])
    .map((s) => {
      if (s.isGeneralAdmission) {
        return {
          ticketTypeId: s.ticketTypeId,
          quantity: Number(s.quantity || 1),
        };
      }

      return {
        ticketTypeId: s.ticketTypeId,
        seatId: s.id,
      };
    })
    .filter(Boolean);
};

  const extractOrderId = (resp) => {
    return (
      resp?.data?.data?.orderId ||
      resp?.data?.orderId ||
      resp?.orderId ||
      resp?.data?.data?.order?.id ||
      resp?.data?.order?.id ||
      null
    );
  };

  const extractBackendTickets = (resp) => {
    return (
      resp?.data?.data?.tickets ||
      resp?.data?.tickets ||
      resp?.tickets ||
      []
    );
  };

  const extractClientSecret = (resp) => {
    return (
      resp?.data?.data?.clientSecret ||
      resp?.data?.clientSecret ||
      resp?.clientSecret ||
      null
    );
  };

  const handlePayNow = async () => {
    if (isProcessingPayment || checkoutLocked || isTimerBlocking) return;
    if (!acceptTerms) return;
    if (!validateForm()) return;

    if (!stripe || !elements) {
      setPaymentError('Stripe aún no está listo. Intenta nuevamente en unos segundos.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('No se pudo inicializar el formulario de tarjeta.');
      return;
    }

    if (!event?.id) {
      alert('No se encontró el evento seleccionado. Vuelve al evento e intenta de nuevo.');
      return;
    }

    const functionId = selectedFunction?.id || event?.functions?.[0]?.id;
    if (!functionId) {
      alert('No se encontró la función del evento. Selecciona una función e intenta de nuevo.');
      return;
    }

    const items = buildGuestItems();
    if (!items || items.length === 0) {
      alert('No hay entradas seleccionadas.');
      return;
    }

    const seatsioSession = isSeatedEvent ? getStoredSeatsioSession() : null;

    if (isSeatedEvent) {
      if (!seatsioSession?.token || !purchaseTimer?.isActive) {
        alert('La reserva temporal de asientos expiró. Vuelve a seleccionar tus asientos.');
        return;
      }

      if (seatsioSession.functionId !== functionId) {
        alert('La sesión de asientos no coincide con la función seleccionada. Intenta de nuevo.');
        return;
      }
    }

    setPaymentError('');
    setIsProcessingPayment(true);

    try {
      setCheckoutLocked(true);

      const isRealAuthedCustomer =
        isLoggedIn &&
        !!currentUser?.id &&
        !purchaseAsGuest;

      const payload = {
        functionId,
        buyerEmail: formData.email,
        buyerName: `${formData.firstName} ${formData.lastName}`.trim(),
        buyerPhone: formData.phone,
        items,
        holdToken: isSeatedEvent ? seatsioSession?.token : undefined,
        userId: isRealAuthedCustomer ? currentUser.id : undefined,

        subtotal: Number(summary.subtotal || 0),
        serviceFee: Number(summary.serviceFee || 0),
        salesTax: Number(summary.tax || 0),
        total: Number(summary.total || 0),
      };

      const created = await createGuestOrder(payload);
      console.log('[CheckoutPage] createGuestOrder response:', created);

      const orderIdReal = extractOrderId(created);
      const backendTickets = extractBackendTickets(created);
      const clientSecret = extractClientSecret(created);

      if (!orderIdReal) {
        throw new Error('El backend no devolvió orderId. Revisa la respuesta en consola.');
      }

      if (!clientSecret) {
        throw new Error('El backend no devolvió clientSecret de Stripe.');
      }

      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: formData.phone,
          },
        },
      });

      if (paymentResult.error) {
        throw new Error(
          paymentResult.error.message ||
            'Stripe no pudo procesar el pago. Intenta nuevamente.'
        );
      }

      if (paymentResult.paymentIntent?.status !== 'succeeded') {
        throw new Error('El pago no fue confirmado por Stripe.');
      }

      const confirmationData = {
        orderId: orderIdReal,
        backendTickets,
        event: {
          id: event.id,
          title: event.title,
          image: event.image,
          imageUrl: event.imageUrl || event.image,
          date: selectedFunction?.date || event.date,
          time: selectedFunction?.time || event.time,
          venue: event.venue,
          city: event.city,
          functions: event.functions || []
        },
        selectedFunction: selectedFunction || (event.functions?.[0] || null),
        tickets: selectedTickets || [],
        seats: selectedSeats || [],
        buyer: formData,
        total: summary.total,
        currency: summary.currency,
        paymentMethod: 'card',
        paymentIntentId: paymentResult.paymentIntent.id,
        timestamp: new Date().toISOString()
      };

      sessionStorage.setItem('prontoticket_confirmation', JSON.stringify(confirmationData));
      sessionStorage.removeItem(SEATSIO_SESSION_STORAGE_KEY);

      clearPurchase();

      navigate(`/evento/${id}/confirmacion/${orderIdReal}`);
    } catch (error) {
      console.error('[CheckoutPage] Error al procesar el pago:', error);
      setCheckoutLocked(false);
      setPaymentError(error.message || 'Error al procesar el pago. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleGoBack = () => {
    navigate(`/evento/${id}/resumen`);
  };

    const canPayNow =
    acceptTerms &&
    stripeReady &&
    hasSelections &&
    !isProcessingPayment &&
    !checkoutLocked &&
    !isTimerBlocking &&
    !authLoading;

  if (!event || !hasSelections) {
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
              <p className="text-white/60 mb-6">No tienes entradas seleccionadas para comprar.</p>
              <button
                onClick={() => navigate(`/evento/${id}`)}
                className="px-6 py-3 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110"
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
          <div className="mb-8">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Checkout
            </h1>
            <p className="text-white/60 text-sm sm:text-base">Completa tus datos y realiza el pago</p>
          </div>

          {showTimer && (
            <div
              className={`mb-6 rounded-2xl border px-4 py-4 ${
                purchaseTimer?.isExpired
                  ? 'border-red-500/30 bg-red-500/10'
                  : purchaseTimer?.isWarning
                  ? 'border-[#FF9500]/30 bg-[#FF9500]/10'
                  : 'border-[#007AFF]/30 bg-[#007AFF]/10'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">
                    Tiempo restante para finalizar el pago
                  </p>
                  {timerMessage && (
                    <p className="text-white/70 text-sm mt-1">{timerMessage}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-white/60 text-xs uppercase tracking-wide">Timer</div>
                  <div className="text-2xl font-bold text-[#FF9500]">{timerLabel}</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6">
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
                    {isLoggedIn && currentUser && !authLoading && (
                      <p className="text-white/50 text-xs">
                        Sesión iniciada como {currentUser?.email}
                      </p>
                    )}
                  </div>
                </div>

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
                        disabled={checkoutLocked || isTimerBlocking}
                        className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${
                          errors.firstName ? 'border-red-500' : 'border-white/10'
                        }`}
                      />
                      {errors.firstName && (
                        <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                      )}
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
                        disabled={checkoutLocked || isTimerBlocking}
                        className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${
                          errors.lastName ? 'border-red-500' : 'border-white/10'
                        }`}
                      />
                      {errors.lastName && (
                        <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                      )}
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
                      disabled={checkoutLocked || isTimerBlocking}
                      className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${
                        errors.email ? 'border-red-500' : 'border-white/10'
                      }`}
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
                      disabled={checkoutLocked || isTimerBlocking}
                      className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${
                        errors.phone ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  {isLoggedIn ? (
                    <div className="rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/20 px-4 py-3 text-sm text-white/80">
                      Esta compra se asociará automáticamente a tu cuenta.
                    </div>
                  ) : (
                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={purchaseAsGuest}
                          onChange={(e) => setPurchaseAsGuest(e.target.checked)}
                          disabled={checkoutLocked || isTimerBlocking}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                            purchaseAsGuest
                              ? 'bg-[#007AFF] border-[#007AFF]'
                              : 'border-white/30 group-hover:border-white/50'
                          }`}
                        >
                          {purchaseAsGuest && (
                            <Check size={12} className="text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                      <span className="text-white/70 text-sm">
                        Comprar como invitado (sin crear cuenta)
                      </span>
                    </label>
                  )}

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        disabled={checkoutLocked || isTimerBlocking}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                          acceptTerms
                            ? 'bg-[#007AFF] border-[#007AFF]'
                            : 'border-white/30 group-hover:border-white/50'
                        }`}
                      >
                        {acceptTerms && (
                          <Check size={12} className="text-white" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                    <span className="text-white/70 text-sm">
                      Acepto los{' '}
                      <a href="#" className="text-[#007AFF] hover:underline">
                        Términos y Condiciones
                      </a>{' '}
                      y la{' '}
                      <a href="#" className="text-[#007AFF] hover:underline">
                        Política de Privacidad
                      </a>{' '}
                      <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#FF9500]/10 flex items-center justify-center">
                    <CreditCard size={20} className="text-[#FF9500]" />
                  </div>
                  <div>
                    <h2
                      className="text-lg sm:text-xl font-bold text-white tracking-tight"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Pago
                    </h2>
                    <p className="text-white/50 text-xs">Procesado de forma segura con Stripe</p>
                  </div>
                </div>

                <StripeCardSection
                  onReady={handleStripeReady}
                  onError={handleStripeError}
                  disabled={checkoutLocked || !acceptTerms || isTimerBlocking}
                />

                {paymentError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
                    <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-semibold text-sm">Error en el pago</p>
                      <p className="text-red-300/80 text-sm mt-1">{paymentError}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePayNow}
                  disabled={!canPayNow}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[#FF9500]/50 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
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

            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-32 space-y-6">
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5">
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
                  {hasMultipleFunctions && selectedFunction && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-white/50 text-xs">Función: </span>
                      <span className="text-[#007AFF] text-xs font-semibold">
                        {selectedFunction.date} - {selectedFunction.time}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGoBack}
                  disabled={isProcessingPayment}
                  className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
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

const CheckoutPage = () => {
  const publishableKey = getStripePublishableKey();

  if (!publishableKey) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 text-center">
        <div className="bg-[#121212] border border-red-500/20 rounded-2xl p-6 max-w-lg">
          <h2 className="text-white text-2xl font-bold mb-3">Falta configuración de Stripe</h2>
          <p className="text-white/60">
            Debes agregar <span className="text-[#FF9500] font-mono">VITE_STRIPE_PUBLIC_KEY</span> o{' '}
            <span className="text-[#FF9500] font-mono">REACT_APP_STRIPE_PUBLISHABLE_KEY</span> en el
            archivo .env del frontend y reiniciar la aplicación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};
export default CheckoutPage;