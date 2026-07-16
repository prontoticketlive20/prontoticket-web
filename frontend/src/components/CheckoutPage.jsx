import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  User,
} from 'lucide-react';

import Header from './Header';
import Footer from './Footer';
import PayPalPayment from './payments/PayPalPayment';

import { usePurchase } from '../context/PurchaseContext';
import { createGuestOrder } from '../services/orders.service';
import api from '../api/api';

const SEATSIO_SESSION_STORAGE_KEY = 'prontoticket_seatsio_session';

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

const extractApiData = (response) => {
  return response?.data?.data ?? response?.data ?? response;
};

const extractOrderId = (response) => {
  const data = extractApiData(response);

  return (
    data?.orderId ||
    data?.order?.id ||
    response?.orderId ||
    response?.id ||
    null
  );
};

const extractBackendTickets = (response) => {
  const data = extractApiData(response);

  return data?.tickets || response?.tickets || [];
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;
  const message = responseData?.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item?.constraints) {
          return Object.values(item.constraints).join(', ');
        }

        if (Array.isArray(item?.children) && item.children.length > 0) {
          return item.children
            .flatMap((child) => {
              if (child?.constraints) {
                return Object.values(child.constraints);
              }

              if (Array.isArray(child?.children)) {
                return child.children.flatMap((nestedChild) =>
                  nestedChild?.constraints
                    ? Object.values(nestedChild.constraints)
                    : [],
                );
              }

              return [];
            })
            .join(', ');
        }

        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .filter(Boolean)
      .join(' | ');
  }

  if (message && typeof message === 'object') {
    try {
      return JSON.stringify(message);
    } catch {
      return 'El backend devolvió un error de validación.';
    }
  }

  if (typeof responseData?.error === 'string') {
    return responseData.error;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return 'No se pudo procesar la solicitud. Intenta nuevamente.';
};

const CheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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
    timerLabel,
  } = usePurchase();

  const discountPercent = location.state?.discountPercent || 0;
  const discountAmount = location.state?.discountAmount || 0;
  const finalTotalFromSummary = location.state?.finalTotal;

  const campaignId =
    location.state?.campaignId ||
    localStorage.getItem('ptl_campaign_id') ||
    null;

  const summary = getPurchaseSummary();

  const total = Number(
    finalTotalFromSummary ?? summary?.total ?? 0,
  );

  const event = selectedEvent;

  const isSeatedEvent =
    String(event?.saleType || '').toLowerCase() === 'seated';

  const hasMultipleFunctions =
    Array.isArray(event?.functions) &&
    event.functions.length > 1;

  const hasTicketSelections =
    Array.isArray(selectedTickets) &&
    selectedTickets.some(
      (ticket) => Number(ticket?.quantity || 0) > 0,
    );

  const hasSeatSelections =
    Array.isArray(selectedSeats) &&
    selectedSeats.length > 0;

  const hasSelections = isSeatedEvent
    ? hasSeatSelections
    : hasTicketSelections;

  const isTimerBlocking =
    purchaseTimer?.mode === event?.saleType &&
    !purchaseTimer?.isActive;

  const showTimer =
    purchaseTimer?.mode === event?.saleType &&
    (purchaseTimer?.isActive || purchaseTimer?.isExpired);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [purchaseAsGuest, setPurchaseAsGuest] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalConfigLoading, setPaypalConfigLoading] =
    useState(true);
  const [paypalConfigError, setPaypalConfigError] =
    useState('');

  const [localOrderId, setLocalOrderId] = useState(null);
  const [backendTickets, setBackendTickets] = useState([]);

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState(false);

  const [paymentError, setPaymentError] = useState('');
  const [checkoutLocked, setCheckoutLocked] = useState(false);

  /*
   * Guardamos la fuente de marketing o distribución cuando
   * viene en la URL.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source');

    if (source) {
      localStorage.setItem('ptl_source', source);
      console.log('📊 SOURCE CAPTURADO:', source);
    }
  }, []);

  /*
   * Cargar configuración pública de PayPal desde el backend.
   * El Secret nunca llega al navegador.
   */
  useEffect(() => {
    let active = true;

    const loadPayPalConfig = async () => {
      try {
        setPaypalConfigLoading(true);
        setPaypalConfigError('');

        const response = await api.get('/paypal/config');
        const data = extractApiData(response);

        const clientId = data?.clientId || '';

        if (!clientId) {
          throw new Error(
            'El backend no devolvió el Client ID de PayPal.',
          );
        }

        if (active) {
          setPaypalClientId(clientId);
        }
      } catch (error) {
        console.error(
          '[CheckoutPage] Error cargando configuración PayPal:',
          error,
        );

        if (active) {
          setPaypalConfigError(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setPaypalConfigLoading(false);
        }
      }
    };

    loadPayPalConfig();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Cargar comprador autenticado.
   */
  useEffect(() => {
    let active = true;

    const loadCurrentUser = async () => {
      try {
        const token =
          localStorage.getItem('ptl_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('pt_token');

        if (!token) {
          if (active) {
            setIsLoggedIn(false);
            setCurrentUser(null);
          }

          return;
        }

        const response = await api.get('/auth/me');
        const userData = extractApiData(response);

        if (!active) {
          return;
        }

        const userId =
          userData?.userId || userData?.id || null;

        const email = userData?.email || '';
        const name = userData?.name || '';

        const nameParts = splitFullName(name);

        const normalizedUser = {
          id: userId,
          name,
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          email,
          phone: '',
          role: userData?.role || null,
          isLoggedIn: true,
        };

        setCurrentUser(normalizedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.warn(
          '[CheckoutPage] No se pudo cargar el usuario autenticado:',
          error,
        );

        if (active) {
          setIsLoggedIn(false);
          setCurrentUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Prellenar los datos cuando el comprador inició sesión.
   */
  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      firstName:
        previous.firstName || currentUser.firstName || '',
      lastName:
        previous.lastName || currentUser.lastName || '',
      email:
        previous.email || currentUser.email || '',
      phone:
        previous.phone || currentUser.phone || '',
    }));
  }, [isLoggedIn, currentUser]);

  /*
   * Expiración de la reserva.
   */
  useEffect(() => {
    if (!purchaseTimer?.isExpired || !hasSelections) {
      return undefined;
    }

    expirePurchase();

    const timeout = setTimeout(() => {
      if (isSeatedEvent) {
        navigate(`/evento/${id}/asientos`, {
          replace: true,
        });
      } else {
        navigate(`/evento/${id}`, {
          replace: true,
        });
      }
    }, 1200);

    return () => clearTimeout(timeout);
  }, [
    purchaseTimer?.isExpired,
    hasSelections,
    expirePurchase,
    isSeatedEvent,
    navigate,
    id,
  ]);

  const timerMessage = useMemo(() => {
    if (purchaseTimer?.isExpired) {
      return 'Tu tiempo de compra expiró. Debes volver a seleccionar tus entradas.';
    }

    if (purchaseTimer?.isWarning) {
      return 'Tu reserva está por expirar. Finaliza el pago antes de que se liberen tus entradas.';
    }

    return null;
  }, [
    purchaseTimer?.isExpired,
    purchaseTimer?.isWarning,
  ]);

  const handleInputChange = (eventInput) => {
    const { name, value } = eventInput.target;

    /*
     * Después de crear la orden no permitimos cambiar la
     * información del comprador, porque la orden local ya existe.
     */
    if (localOrderId) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: null,
      }));
    }
  };

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
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim(),
      )
    ) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const buildGuestItems = () => {
    if (!isSeatedEvent) {
      return (selectedTickets || [])
        .filter(
          (ticket) =>
            Number(ticket?.quantity || 0) > 0,
        )
        .map((ticket) => ({
          ticketTypeId:
            ticket.ticketTypeId || ticket.id,
          quantity: Number(ticket.quantity || 0),
        }));
    }

    return (selectedSeats || []).map((seat) => ({
      ticketTypeId: seat.ticketTypeId,
      seatId: seat.id,
    }));
  };

  /*
   * Primer paso:
   * crear únicamente la orden local PENDING.
   *
   * Después se habilitan los botones de PayPal.
   */
  const handlePrepareOrder = async () => {
    if (
      isCreatingOrder ||
      isProcessingPayment ||
      checkoutLocked ||
      localOrderId ||
      isTimerBlocking
    ) {
      return;
    }

    if (!acceptTerms) {
      setPaymentError(
        'Debes aceptar los Términos y Condiciones para continuar.',
      );
      return;
    }

    if (!validateForm()) {
      setPaymentError(
        'Completa correctamente la información del comprador.',
      );
      return;
    }

    if (!event?.id) {
      setPaymentError(
        'No se encontró el evento seleccionado.',
      );
      return;
    }

    const functionId =
      selectedFunction?.id ||
      event?.functions?.[0]?.id;

    if (!functionId) {
      setPaymentError(
        'No se encontró la función seleccionada.',
      );
      return;
    }

    const items = buildGuestItems();

    if (!items.length) {
      setPaymentError(
        'No hay entradas seleccionadas.',
      );
      return;
    }

    const seatsioSession = isSeatedEvent
      ? getStoredSeatsioSession()
      : null;

    if (isSeatedEvent) {
      if (
        !seatsioSession?.token ||
        !purchaseTimer?.isActive
      ) {
        setPaymentError(
          'La reserva temporal de asientos expiró. Vuelve a seleccionar tus asientos.',
        );
        return;
      }

      if (
        seatsioSession.functionId !== functionId
      ) {
        setPaymentError(
          'La sesión de asientos no coincide con la función seleccionada.',
        );
        return;
      }
    }

    setPaymentError('');
    setIsCreatingOrder(true);

    try {
      const isRealAuthenticatedCustomer =
        isLoggedIn &&
        Boolean(currentUser?.id) &&
        !purchaseAsGuest;

      const source =
        localStorage.getItem('ptl_source') || 'web';

      const payload = {
        functionId,
        buyerEmail: formData.email.trim().toLowerCase(),
        buyerName:
          `${formData.firstName} ${formData.lastName}`.trim(),
        buyerPhone: formData.phone.trim(),
        items,

        holdToken: isSeatedEvent
          ? seatsioSession?.token
          : undefined,

        userId: isRealAuthenticatedCustomer
          ? currentUser.id
          : undefined,

        campaignId: campaignId || undefined,
        platform: source,

        /*
         * El backend recalcula estos valores.
         * Se envían solo para mantener compatibilidad con el DTO
         * y con versiones anteriores del frontend.
         */
        subtotal: Number(summary?.subtotal || 0),
        serviceFee: Number(summary?.serviceFee || 0),
        salesTax: Number(summary?.tax || 0),
        total,
      };

      console.log(
        '[CheckoutPage] Creando orden local PayPal',
        payload,
      );

      const created = await createGuestOrder(payload);

      console.log(
        '🟢 RESPONSE CREATE ORDER PAYPAL:',
        created,
      );

      const createdOrderId = extractOrderId(created);
      const createdTickets =
        extractBackendTickets(created);

      if (!createdOrderId) {
        throw new Error(
          'El backend no devolvió el orderId.',
        );
      }

      setLocalOrderId(createdOrderId);
      setBackendTickets(createdTickets);
      setCheckoutLocked(true);
    } catch (error) {
      console.error(
        '[CheckoutPage] Error creando la orden local:',
        error,
      );

      setPaymentError(getErrorMessage(error));
      setCheckoutLocked(false);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  /*
   * PayPalPayment llama este método después de que:
   *
   * 1. PayPal aprobó la orden.
   * 2. Nuestro backend capturó el dinero.
   * 3. La orden local quedó PAID.
   * 4. Se confirmó inventario, Seats.io, analytics y email.
   */
  const handlePayPalApproved = async ({
    localOrderId: approvedLocalOrderId,
    paypalOrderId,
    captureId,
    status,
  }) => {
    const confirmationData = {
      orderId: approvedLocalOrderId,
      backendTickets,

      event: {
        id: event?.id,
        title: event?.title,
        image: event?.image,
        imageUrl:
          event?.imageUrl || event?.image,
        date:
          selectedFunction?.date || event?.date,
        time:
          selectedFunction?.time || event?.time,
        venue: event?.venue,
        city: event?.city,
        functions: event?.functions || [],
      },

      selectedFunction:
        selectedFunction ||
        event?.functions?.[0] ||
        null,

      tickets: selectedTickets || [],
      seats: selectedSeats || [],
      buyer: formData,
      total,
      currency: summary?.currency || 'USD',

      paymentMethod: 'PAYPAL',
      paypalOrderId,
      captureId,
      paymentStatus: status,

      timestamp: new Date().toISOString(),
    };

    sessionStorage.setItem(
      'prontoticket_confirmation',
      JSON.stringify(confirmationData),
    );

    clearPurchase();

    navigate(
      `/evento/${id}/confirmacion/${approvedLocalOrderId}`,
    );
  };

  const handlePayPalCancel = () => {
    setIsProcessingPayment(false);
    setPaymentError(
      'El pago fue cancelado. Puedes intentarlo nuevamente.',
    );
  };

  const handlePayPalError = (error) => {
    console.error(
      '[CheckoutPage] Error recibido desde PayPal:',
      error,
    );

    setIsProcessingPayment(false);
    setPaymentError(getErrorMessage(error));
  };

  const handleGoBack = () => {
    navigate(`/evento/${id}/resumen`);
  };

  const canPrepareOrder =
    acceptTerms &&
    hasSelections &&
    !authLoading &&
    !paypalConfigLoading &&
    Boolean(paypalClientId) &&
    !isCreatingOrder &&
    !isProcessingPayment &&
    !checkoutLocked &&
    !localOrderId &&
    !isTimerBlocking;

  const storedConfirmation =
    sessionStorage.getItem(
      'prontoticket_confirmation',
    );

  if (
    !event ||
    (!hasSelections && !storedConfirmation)
  ) {
    return (
      <div
        className="min-h-screen bg-[#0A0A0A]"
        data-testid="checkout-page"
      >
        <Header />

        <div className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart
                  size={32}
                  className="text-white/40"
                />
              </div>

              <h2
                className="text-2xl font-bold text-white mb-2"
                style={{
                  fontFamily:
                    "'Outfit', sans-serif",
                }}
              >
                No hay selecciones
              </h2>

              <p className="text-white/60 mb-6">
                No tienes entradas seleccionadas para
                comprar.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/evento/${event?.slug}-${event?.id}`,
                  )
                }
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
    <div
      className="min-h-screen bg-[#0A0A0A]"
      data-testid="checkout-page"
    >
      <Header />

      <div className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-2"
              style={{
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Checkout
            </h1>

            <p className="text-white/60 text-sm sm:text-base">
              Completa tus datos y realiza el pago
            </p>
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
                    <p className="text-white/70 text-sm mt-1">
                      {timerMessage}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-white/60 text-xs uppercase tracking-wide">
                    Timer
                  </div>

                  <div className="text-2xl font-bold text-[#FF9500]">
                    {timerLabel}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {/* Información del comprador */}
              <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                    <User
                      size={20}
                      className="text-[#007AFF]"
                    />
                  </div>

                  <div>
                    <h2
                      className="text-lg sm:text-xl font-bold text-white tracking-tight"
                      style={{
                        fontFamily:
                          "'Outfit', sans-serif",
                      }}
                    >
                      Información del comprador
                    </h2>

                    {isLoggedIn &&
                      currentUser &&
                      !authLoading && (
                        <p className="text-white/50 text-xs">
                          Sesión iniciada como{' '}
                          {currentUser.email}
                        </p>
                      )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-white/70 text-sm mb-2"
                        htmlFor="firstName"
                      >
                        Nombre{' '}
                        <span className="text-red-400">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={
                          checkoutLocked ||
                          isTimerBlocking
                        }
                        className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${
                          errors.firstName
                            ? 'border-red-500'
                            : 'border-white/10'
                        }`}
                      />

                      {errors.firstName && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        className="block text-white/70 text-sm mb-2"
                        htmlFor="lastName"
                      >
                        Apellido{' '}
                        <span className="text-red-400">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={
                          checkoutLocked ||
                          isTimerBlocking
                        }
                        className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${
                          errors.lastName
                            ? 'border-red-500'
                            : 'border-white/10'
                        }`}
                      />

                      {errors.lastName && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-white/70 text-sm mb-2"
                      htmlFor="email"
                    >
                      <Mail
                        size={14}
                        className="inline mr-1"
                      />
                      Correo electrónico{' '}
                      <span className="text-red-400">
                        *
                      </span>
                    </label>

                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={
                        checkoutLocked ||
                        isTimerBlocking
                      }
                      className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${
                        errors.email
                          ? 'border-red-500'
                          : 'border-white/10'
                      }`}
                    />

                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-white/70 text-sm mb-2"
                      htmlFor="phone"
                    >
                      <Phone
                        size={14}
                        className="inline mr-1"
                      />
                      Teléfono{' '}
                      <span className="text-red-400">
                        *
                      </span>
                    </label>

                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={
                        checkoutLocked ||
                        isTimerBlocking
                      }
                      className={`w-full px-4 py-3 bg-[#1E1E1E] border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50 ${
                        errors.phone
                          ? 'border-red-500'
                          : 'border-white/10'
                      }`}
                    />

                    {errors.phone && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  {isLoggedIn ? (
                    <div className="rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/20 px-4 py-3 text-sm text-white/80">
                      Esta compra se asociará
                      automáticamente a tu cuenta.
                    </div>
                  ) : (
                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={purchaseAsGuest}
                          onChange={(inputEvent) =>
                            setPurchaseAsGuest(
                              inputEvent.target.checked,
                            )
                          }
                          disabled={
                            checkoutLocked ||
                            isTimerBlocking
                          }
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
                            <Check
                              size={12}
                              className="text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                      </div>

                      <span className="text-white/70 text-sm">
                        Comprar como invitado
                      </span>
                    </label>
                  )}

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(inputEvent) => {
                          if (!localOrderId) {
                            setAcceptTerms(
                              inputEvent.target.checked,
                            );
                          }
                        }}
                        disabled={
                          checkoutLocked ||
                          isTimerBlocking
                        }
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
                          <Check
                            size={12}
                            className="text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    </div>

                    <span className="text-white/70 text-sm">
                      Acepto los{' '}
                      <a
                        href="#"
                        className="text-[#007AFF] hover:underline"
                      >
                        Términos y Condiciones
                      </a>{' '}
                      y la{' '}
                      <a
                        href="#"
                        className="text-[#007AFF] hover:underline"
                      >
                        Política de Privacidad
                      </a>{' '}
                      <span className="text-red-400">
                        *
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Pago */}
              <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 sm:p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#FF9500]/10 flex items-center justify-center">
                    <CreditCard
                      size={20}
                      className="text-[#FF9500]"
                    />
                  </div>

                  <div>
                    <h2
                      className="text-lg sm:text-xl font-bold text-white tracking-tight"
                      style={{
                        fontFamily:
                          "'Outfit', sans-serif",
                      }}
                    >
                      Paga con PayPal o tarjeta
                    </h2>

                    <p className="text-white/50 text-xs">
                      PayPal mostrará las opciones disponibles
                      para tu dispositivo y ubicación.
                    </p>
                  </div>
                </div>

                {paypalConfigLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#007AFF] animate-spin" />

                    <span className="ml-2 text-white/60 text-sm">
                      Preparando métodos de pago...
                    </span>
                  </div>
                )}

                {paypalConfigError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
                    <AlertTriangle
                      size={18}
                      className="text-red-400 flex-shrink-0 mt-0.5"
                    />

                    <div>
                      <p className="text-red-400 font-semibold text-sm">
                        No se pudo cargar PayPal
                      </p>

                      <p className="text-red-300/80 text-sm mt-1">
                        {paypalConfigError}
                      </p>
                    </div>
                  </div>
                )}

                {!paypalConfigLoading &&
                  !paypalConfigError &&
                  !localOrderId && (
                    <>
                      <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4 mb-5">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <BadgeCheck
                            size={16}
                            className="text-[#22c55e]"
                          />

                          <span className="text-white/80 text-sm font-semibold">
                            Formas de pago
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {[
                            'PayPal',
                            'Tarjeta de crédito',
                            'Tarjeta de débito',
                          ].map((method) => (
                            <div
                              key={method}
                              className="px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-white/10 text-white/70 text-xs font-medium"
                            >
                              {method}
                            </div>
                          ))}
                        </div>

                        <p className="text-center text-white/40 text-[11px] mt-3 leading-relaxed">
                          La opción de tarjeta se mostrará cuando
                          esté disponible para el comprador.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handlePrepareOrder}
                        disabled={!canPrepareOrder}
                        className="w-full py-4 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[#FF9500]/50 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isCreatingOrder ? (
                          <>
                            <Loader2
                              size={20}
                              className="animate-spin"
                            />

                            <span>
                              Preparando pago...
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock size={18} />

                            <span>
                              Continuar para pagar{' '}
                              {formatPrice(total)}
                            </span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                {localOrderId &&
                  paypalClientId && (
                    <>
                      <div className="mb-5 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3">
                        <p className="text-[#86efac] text-sm font-semibold">
                          Orden preparada correctamente
                        </p>

                        <p className="text-white/60 text-xs mt-1">
                          Selecciona PayPal o la opción de
                          tarjeta que aparezca disponible.
                        </p>
                      </div>

                      <PayPalPayment
                        clientId={paypalClientId}
                        localOrderId={localOrderId}
                        disabled={
                          isTimerBlocking ||
                          isCreatingOrder
                        }
                        onApproved={
                          handlePayPalApproved
                        }
                        onCancel={
                          handlePayPalCancel
                        }
                        onError={
                          handlePayPalError
                        }
                        onProcessingChange={
                          setIsProcessingPayment
                        }
                      />
                    </>
                  )}

                {paymentError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
                    <AlertTriangle
                      size={18}
                      className="text-red-400 flex-shrink-0 mt-0.5"
                    />

                    <div>
                      <p className="text-red-400 font-semibold text-sm">
                        Error en el pago
                      </p>

                      <p className="text-red-300/80 text-sm mt-1">
                        {paymentError}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <p className="text-xs text-white/60">
                    ❤️ Parte del fee de este boleto será
                    destinado a ayuda directa para Venezuela.
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen lateral */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-32 space-y-6">
                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5">
                  <h3
                    className="text-base font-bold text-white mb-4 tracking-tight"
                    style={{
                      fontFamily:
                        "'Outfit', sans-serif",
                    }}
                  >
                    Evento
                  </h3>

                  <div className="flex gap-3">
                    <img
                      src={
                        event.image ||
                        event.imageUrl
                      }
                      alt={event.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                        {event.title}
                      </h4>

                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-xs text-white/60">
                          <Calendar
                            size={12}
                            className="text-[#007AFF]"
                          />

                          <span>
                            {selectedFunction?.date ||
                              event.date}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 text-xs text-white/60">
                          <Clock
                            size={12}
                            className="text-[#FF9500]"
                          />

                          <span>
                            {selectedFunction?.time ||
                              event.time}{' '}
                            hrs
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 text-xs text-white/60">
                          <MapPin
                            size={12}
                            className="text-[#007AFF]"
                          />

                          <span className="truncate">
                            {selectedFunction?.venueName ||
                              event.venue}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {hasMultipleFunctions &&
                    selectedFunction && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <span className="text-white/50 text-xs">
                          Función:{' '}
                        </span>

                        <span className="text-[#007AFF] text-xs font-semibold">
                          {selectedFunction.date} -{' '}
                          {selectedFunction.time}
                        </span>
                      </div>
                    )}
                </div>

                <div className="bg-[#121212] rounded-2xl border border-white/10 p-5">
                  <h3 className="text-base font-bold text-white mb-4">
                    Resumen del pago
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Entradas</span>
                      <span>
                        {formatPrice(
                          Number(
                            summary?.subtotal || 0,
                          ),
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-white/60">
                      <span>Fee de servicio</span>
                      <span>
                        {formatPrice(
                          Number(
                            summary?.serviceFee ||
                              0,
                          ),
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-white/60">
                      <span>Impuestos</span>
                      <span>
                        {formatPrice(
                          Number(summary?.tax || 0),
                        )}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[#22c55e]">
                        <span>
                          Descuento
                          {discountPercent > 0
                            ? ` (${discountPercent}%)`
                            : ''}
                        </span>

                        <span>
                          -
                          {formatPrice(
                            Number(discountAmount),
                          )}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/10 flex justify-between text-white font-bold text-lg">
                      <span>Total</span>
                      <span className="text-[#FF9500]">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoBack}
                  disabled={
                    isProcessingPayment ||
                    isCreatingOrder ||
                    Boolean(localOrderId)
                  }
                  className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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