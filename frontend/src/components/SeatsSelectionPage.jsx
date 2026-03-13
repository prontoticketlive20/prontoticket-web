import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SeatsioSeatingChart } from '@seatsio/seatsio-react';
import Header from './Header';
import Footer from './Footer';
import {
  Calendar,
  MapPin,
  Clock,
  X,
  ChevronLeft,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import api from '../api/api';
import { fetchEventById } from '../services/events.service';
import { usePurchase } from '../context/PurchaseContext';

const VALID_SALE_TYPES = ['seated', 'general'];

const SEATSIO_WORKSPACE_KEY = '525c2c82-fb6b-4e5d-899f-8bed4d5c1130';
const SEATSIO_REGION = 'na';
const SEATSIO_SESSION_STORAGE_KEY = 'prontoticket_seatsio_session';

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const getDisplayedLabel = (object) =>
  object?.labels?.displayedLabel ||
  object?.labels?.own?.label ||
  object?.label ||
  object?.id ||
  '';

const getRowLabel = (object) =>
  object?.labels?.parent?.label ||
  object?.labels?.parent ||
  object?.labels?.own?.row ||
  '';

const getCategoryLabel = (object) =>
  object?.category?.label ||
  object?.categoryLabel ||
  '';

const getStoredSeatsioSession = () => {
  try {
    const raw = sessionStorage.getItem(SEATSIO_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveSeatsioSession = (data) => {
  try {
    sessionStorage.setItem(SEATSIO_SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const clearSeatsioSession = () => {
  try {
    sessionStorage.removeItem(SEATSIO_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const SeatsSelectionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const syncingSelectionRef = useRef(false);

  const {
    selectedEvent,
    selectEvent,
    selectedFunction,
    selectFunction,
    addSeat,
    removeSeat,
    selectedSeats,
    formatPrice,
    getServiceFee,
    getStoredEventId,
  } = usePurchase();

  const [event, setEvent] = useState(selectedEvent || null);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [isInitialized, setIsInitialized] = useState(false);

  const [pricingList, setPricingList] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [chartError, setChartError] = useState('');
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [holdTokenData, setHoldTokenData] = useState(null);
  const [holdCallsInProgress, setHoldCallsInProgress] = useState(false);

  const seatmapKey = selectedFunction?._raw?.seatmapKey || '';

  useEffect(() => {
    let mounted = true;

    const loadEvent = async () => {
      try {
        setLoadingEvent(true);

        if (selectedEvent?.id === id) {
          setEvent(selectedEvent);
          setIsInitialized(true);
          return;
        }

        const storedEventId = getStoredEventId();
        const normalized = await fetchEventById(id || storedEventId);

        if (!mounted) return;

        setEvent(normalized);
        selectEvent(normalized);
        setIsInitialized(true);

        if (normalized?.functions?.length === 1) {
          const singleFunc = normalized.functions[0];
          selectFunction(singleFunc);
        }
      } catch (e) {
        console.error('[SeatsSelectionPage] Error cargando evento:', e);
        if (!mounted) return;
        setChartError('No pude cargar la información del evento.');
      } finally {
        if (mounted) setLoadingEvent(false);
      }
    };

    loadEvent();

    return () => {
      mounted = false;
    };
  }, [id, selectedEvent, selectEvent, selectFunction, getStoredEventId]);

  const hasValidSaleType = useMemo(
    () => VALID_SALE_TYPES.includes(event?.saleType),
    [event?.saleType]
  );

  const isSeatedEvent = event?.saleType === 'seated';
  const hasMultipleFunctions = !!(event?.functions && event.functions.length > 1);
  const hasSingleFunction = !!(event?.functions && event.functions.length === 1);

  useEffect(() => {
    if (!isInitialized || !event) return;

    if (!hasValidSaleType || !isSeatedEvent) {
      console.error(
        `[ProntoTicketLive] SeatsSelectionPage: acceso inválido para saleType "${event?.saleType}".`
      );
      navigate(`/evento/${id}`);
    }
  }, [isInitialized, event, hasValidSaleType, isSeatedEvent, id, navigate]);

  useEffect(() => {
    if (!isInitialized || !hasMultipleFunctions) return;

    const timeout = setTimeout(() => {
      if (!selectedFunction) {
        navigate(`/evento/${id}`);
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [isInitialized, hasMultipleFunctions, selectedFunction, id, navigate]);

  useEffect(() => {
    if (hasSingleFunction && event?.functions?.[0] && !selectedFunction) {
      selectFunction(event.functions[0]);
    }
  }, [hasSingleFunction, event?.functions, selectedFunction, selectFunction]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPricing = async () => {
      if (!selectedFunction?.id) {
        setPricingList([]);
        return;
      }

      try {
        setPricingLoading(true);

        const pricingRes = await api.get(
          `/function-ticket-types/function/${selectedFunction.id}`
        );

        const list = Array.isArray(pricingRes.data)
          ? pricingRes.data
          : pricingRes.data?.data || [];

        if (!mounted) return;

        setPricingList(list);
      } catch (err) {
        console.error('[SeatsSelectionPage] Error loading pricing:', err);
        if (!mounted) return;
        setPricingList([]);
      } finally {
        if (mounted) setPricingLoading(false);
      }
    };

    loadPricing();

    return () => {
      mounted = false;
    };
  }, [selectedFunction?.id]);

  useEffect(() => {
    const stored = getStoredSeatsioSession();

    if (
      stored &&
      stored.functionId === selectedFunction?.id &&
      stored.eventKey === String(seatmapKey || '').trim()
    ) {
      setHoldTokenData(stored);
      if (
        typeof stored.expiresInSeconds === 'number' &&
        stored.expiresInSeconds > 0
      ) {
        setTimeRemaining(stored.expiresInSeconds);
      }
      return;
    }

    if (selectedFunction?.id) {
      clearSeatsioSession();
      setHoldTokenData(null);
    }
  }, [selectedFunction?.id, seatmapKey]);

  const pricingMap = useMemo(() => {
    const map = new Map();

    for (const item of pricingList) {
      const label = normalizeText(item?.ticketType?.name);
      if (!label) continue;

      map.set(label, {
        functionTicketTypeId: item.id,
        ticketTypeId: item.ticketTypeId,
        ticketTypeName: item?.ticketType?.name || '',
        price: Number(item.price || 0),
        serviceFee: Number(item?.ticketType?.serviceFee || 0),
        available: Number(item.available || 0),
        sold: Number(item.sold || 0),
      });
    }

    return map;
  }, [pricingList]);

  const seatsioPricing = useMemo(() => {
    const prices = pricingList
      .filter((item) => item?.ticketType?.name)
      .map((item) => ({
        category: item.ticketType.name,
        price: Number(item.price || 0),
      }));

    return {
      priceFormatter: (price) => `$${Number(price || 0).toLocaleString()}`,
      prices,
    };
  }, [pricingList]);

  const selectedSeatIds = useMemo(
    () => new Set((selectedSeats || []).map((seat) => String(seat.id))),
    [selectedSeats]
  );

  const canSelectSeats = !hasMultipleFunctions || selectedFunction !== null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const subtotal = selectedSeats.reduce(
    (sum, seat) => sum + Number(seat.price || 0),
    0
  );

  const serviceFee = selectedSeats.length > 0 ? getServiceFee() : 0;
  const total = subtotal + serviceFee;

  const canContinueToSummary =
    selectedSeats.length > 0 &&
    !holdCallsInProgress &&
    !!holdTokenData?.token;

  const syncChartSelectionFromState = useCallback(async () => {
    const chart = chartRef.current;
    if (!chart || !chartReady) return;

    try {
      syncingSelectionRef.current = true;

      const selectedInChart = await chart.listSelectedObjects();
      const chartIds = new Set(
        (selectedInChart || []).map((obj) => String(obj?.id || getDisplayedLabel(obj)))
      );

      const stateIds = new Set(
        (selectedSeats || []).map((seat) => String(seat.id))
      );

      const idsToDeselect = [...chartIds].filter((idValue) => !stateIds.has(idValue));
      const idsToSelect = [...stateIds].filter((idValue) => !chartIds.has(idValue));

      if (idsToDeselect.length > 0) {
        await chart.deselectObjects(idsToDeselect);
      }

      if (idsToSelect.length > 0) {
        await chart.doSelectObjects(idsToSelect);
      }
    } catch (err) {
      console.error('[SeatsSelectionPage] Error sincronizando selección con el chart:', err);
    } finally {
      syncingSelectionRef.current = false;
    }
  }, [chartReady, selectedSeats]);

  useEffect(() => {
    syncChartSelectionFromState();
  }, [selectedSeats, syncChartSelectionFromState]);

  const handleBackToEvent = () => {
    navigate(`/evento/${id}`);
  };

  const handleContinueToSummary = () => {
    if (canContinueToSummary) {
      navigate(`/evento/${id}/resumen`);
    }
  };

  const handleRemoveSeat = async (seatId) => {
    const chart = chartRef.current;
    const normalizedSeatId = String(seatId || '');

    if (!normalizedSeatId) return;

    try {
      if (chart) {
        syncingSelectionRef.current = true;
        await chart.deselectObjects([normalizedSeatId]);
      }

      removeSeat(normalizedSeatId);
    } catch (err) {
      console.error('[SeatsSelectionPage] No pude deseleccionar la silla desde el panel:', err);
      removeSeat(normalizedSeatId);
    } finally {
      syncingSelectionRef.current = false;
    }
  };

  const handleSeatSelected = (object) => {
    if (syncingSelectionRef.current) return;

    const categoryLabel = getCategoryLabel(object);
    const displayedLabel = getDisplayedLabel(object);
    const rowLabel = getRowLabel(object);

    const matchedPricing = pricingMap.get(normalizeText(categoryLabel));

    if (!matchedPricing) {
      console.error(
        `[SeatsSelectionPage] No encontré pricing/ticketType para la categoría Seats.io "${categoryLabel}".`
      );
      return;
    }

    const seatId = String(object?.id || displayedLabel);

    if (!seatId || selectedSeatIds.has(seatId)) {
      return;
    }

    addSeat({
      id: seatId,
      seat: displayedLabel,
      number: displayedLabel,
      section: categoryLabel || matchedPricing.ticketTypeName || 'Asiento',
      row: rowLabel,
      price: Number(matchedPricing.price || 0),
      serviceFee: Number(matchedPricing.serviceFee || 0),
      ticketTypeId: matchedPricing.ticketTypeId,
      functionId: selectedFunction?.id || null,
      objectType: object?.objectType || 'Seat',
    });
  };

  const handleSeatDeselected = (object) => {
    if (syncingSelectionRef.current) return;

    const seatId = String(object?.id || getDisplayedLabel(object));
    if (seatId) {
      removeSeat(seatId);
    }
  };

  if (loadingEvent || !event) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <div className="pt-32 flex items-center justify-center text-white/70">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Cargando evento...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <div className="sticky top-20 z-40 bg-[#121212] border-b border-white/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={event.image}
                alt={event.title}
                className="w-16 h-16 rounded-lg object-cover hidden sm:block"
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div>
                  <h2
                    className="text-white font-bold text-sm sm:text-base line-clamp-1"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {event.title}
                  </h2>
                  <div className="flex items-center space-x-2 text-white/60 text-xs sm:text-sm mt-0.5">
                    <Calendar size={14} />
                    <span data-testid="selected-function-date">
                      {selectedFunction?.date || event.date}
                    </span>
                    <span>•</span>
                    <span data-testid="selected-function-time">
                      {selectedFunction?.time || event.time} hrs
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center space-x-2 text-white/60 text-sm">
                  <MapPin size={14} />
                  <span>{selectedFunction?.venueName || event.venue}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-[#FF9500]/10 border border-[#FF9500]/30 rounded-lg px-3 py-2">
              <Clock size={16} className="text-[#FF9500]" />
              <span
                className="text-[#FF9500] font-bold text-sm sm:text-base"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {hasMultipleFunctions && selectedFunction && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <span className="text-white/50 text-xs uppercase tracking-wide">
                  Función:
                </span>
                <span
                  className="text-[#007AFF] text-sm font-semibold"
                  data-testid="selected-function-badge"
                >
                  {selectedFunction.date} - {selectedFunction.time} hrs
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-[#121212] rounded-3xl border border-white/10 p-6 shadow-2xl">
              <h2
                className="text-2xl font-bold text-white mb-6 tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Selecciona tus asientos
              </h2>

              {!canSelectSeats ? (
                <div
                  className="relative w-full bg-[#1E1E1E] rounded-2xl border-2 border-[#007AFF]/30 overflow-hidden flex items-center justify-center text-center p-8"
                  style={{ minHeight: '500px', height: '60vh' }}
                >
                  <div>
                    <AlertTriangle
                      className="mx-auto mb-4 text-[#FF9500]"
                      size={36}
                    />
                    <p className="text-white/80 text-lg mb-2">
                      Debes seleccionar una función antes de escoger asientos
                    </p>
                    <p className="text-white/50 text-sm">
                      Vuelve al evento y elige la fecha y hora que deseas comprar.
                    </p>
                  </div>
                </div>
              ) : !seatmapKey ? (
                <div
                  className="relative w-full bg-[#1E1E1E] rounded-2xl border-2 border-red-500/30 overflow-hidden flex items-center justify-center text-center p-8"
                  style={{ minHeight: '500px', height: '60vh' }}
                >
                  <div>
                    <AlertTriangle
                      className="mx-auto mb-4 text-red-400"
                      size={36}
                    />
                    <p className="text-white/80 text-lg mb-2">
                      Esta función no tiene Seats.io configurado
                    </p>
                    <p className="text-white/50 text-sm">
                      Debes cargar el event key de Seats.io en el campo{' '}
                      <span className="text-white/70">seatmapKey</span> de esta función.
                    </p>
                  </div>
                </div>
              ) : pricingLoading ? (
                <div
                  className="relative w-full bg-[#1E1E1E] rounded-2xl border-2 border-[#007AFF]/30 overflow-hidden flex items-center justify-center text-center p-8"
                  style={{ minHeight: '500px', height: '60vh' }}
                >
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#007AFF] mb-4" />
                    <p className="text-white/70 text-lg mb-2">
                      Cargando pricing de la función...
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="relative w-full bg-[#1E1E1E] rounded-2xl border-2 border-[#007AFF]/30 overflow-hidden"
                  style={{ minHeight: '500px', height: '60vh' }}
                  data-testid="seatsio-map-container"
                >
                  {!chartReady && !chartError && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1E1E1E]">
                      <div className="flex flex-col items-center text-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF] mb-4" />
                        <p className="text-white/70 text-lg mb-2">
                          Cargando mapa interactivo...
                        </p>
                        <p className="text-[#007AFF] text-xs">
                          {selectedFunction?.date} - {selectedFunction?.time}
                        </p>
                      </div>
                    </div>
                  )}

                  {chartError ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1E1E1E]">
                      <div className="flex flex-col items-center text-center p-8">
                        <AlertTriangle className="w-8 h-8 text-red-400 mb-4" />
                        <p className="text-white/80 text-lg mb-2">
                          No pude cargar el mapa de asientos
                        </p>
                        <p className="text-white/50 text-sm">{chartError}</p>
                      </div>
                    </div>
                  ) : null}

                  <SeatsioSeatingChart
                    workspaceKey={SEATSIO_WORKSPACE_KEY}
                    event={String(seatmapKey || '').trim()}
                    region={SEATSIO_REGION}
                    session="continue"
                    pricing={seatsioPricing}
                    onRenderStarted={(chart) => {
                      chartRef.current = chart;
                      setChartError('');
                    }}
                    onChartRendered={(chart) => {
                      chartRef.current = chart;
                      setChartReady(true);
                      setChartError('');
                    }}
                    onSessionInitialized={(holdToken) => {
                      const payload = {
                        token: holdToken?.token,
                        expiresAt: holdToken?.expiresAt,
                        expiresInSeconds: holdToken?.expiresInSeconds,
                        functionId: selectedFunction?.id || null,
                        eventKey: String(seatmapKey || '').trim(),
                      };

                      setHoldTokenData(payload);

                      if (typeof holdToken?.expiresInSeconds === 'number') {
                        setTimeRemaining(holdToken.expiresInSeconds);
                      }

                      saveSeatsioSession(payload);
                    }}
                    onHoldCallsInProgress={() => {
                      setHoldCallsInProgress(true);
                    }}
                    onHoldCallsComplete={() => {
                      setHoldCallsInProgress(false);
                    }}
                    onHoldTokenExpired={() => {
                      clearSeatsioSession();
                      setHoldTokenData(null);
                      setChartError(
                        'La reserva temporal de asientos expiró. Selecciónalos de nuevo.'
                      );
                    }}
                    onObjectSelected={handleSeatSelected}
                    onObjectDeselected={handleSeatDeselected}
                    onChartRenderingFailed={(chart, error) => {
                      console.error(
                        '[SeatsSelectionPage] Seats.io render error:',
                        error
                      );
                      setChartReady(false);
                      setChartError(
                        error?.message || 'Error cargando el mapa de Seats.io.'
                      );
                    }}
                    fitTo="width"
                    maxSelectedObjects={10}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-[#007AFF]" />
                  <span className="text-white/60 text-sm">Seleccionado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-white/20" />
                  <span className="text-white/60 text-sm">Disponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-white/10" />
                  <span className="text-white/60 text-sm">Ocupado</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-40">
              <div className="bg-[#121212] rounded-3xl border border-white/10 p-6 shadow-2xl">
                <h3
                  className="text-xl font-bold text-white mb-4 tracking-tight"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Tus asientos seleccionados
                </h3>

                <div className="space-y-3 mb-6 min-h-[200px]">
                  {selectedSeats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <MapPin size={24} className="text-white/40" />
                      </div>
                      <p className="text-white/50 text-sm">
                        Selecciona uno o más asientos en el mapa para continuar
                      </p>
                    </div>
                  ) : (
                    selectedSeats.map((seat) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between p-3 bg-[#1E1E1E] rounded-xl border border-white/5"
                      >
                        <div className="flex-1">
                          <div className="text-white font-semibold text-sm">
                            Asiento {seat.number || seat.seat}
                          </div>
                          <div className="text-white/50 text-xs">
                            {seat.section || 'Categoría'}
                            {seat.row ? ` - Fila ${seat.row}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-[#FF9500] font-bold">
                            {formatPrice(seat.price)}
                          </span>
                          <button
                            onClick={() => handleRemoveSeat(seat.id)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            data-testid={`remove-seat-${seat.id}`}
                            type="button"
                          >
                            <X size={16} className="text-white/60" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Subtotal</span>
                    <span className="text-white font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {selectedSeats.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Cargo por servicio</span>
                      <span className="text-white font-semibold">
                        {formatPrice(serviceFee)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t border-white/5">
                    <span className="text-white font-bold">Total</span>
                    <span
                      className="text-2xl font-bold text-[#FF9500]"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleContinueToSummary}
                  disabled={!canContinueToSummary}
                  className="w-full py-4 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 mb-3"
                  data-testid="continue-to-payment-button"
                  type="button"
                >
                  Ver resumen de compra
                </button>

                {holdCallsInProgress && (
                  <p className="text-xs text-white/50 text-center mb-3">
                    Espera un momento, asegurando asientos temporalmente...
                  </p>
                )}

                <button
                  onClick={handleBackToEvent}
                  className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors flex items-center justify-center space-x-2"
                  data-testid="back-to-event-button"
                  type="button"
                >
                  <ChevronLeft size={18} />
                  <span>Volver al evento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-20" />
      <Footer />
    </div>
  );
};

export default SeatsSelectionPage;