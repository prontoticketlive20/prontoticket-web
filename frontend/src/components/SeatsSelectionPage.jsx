import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Calendar, MapPin, Clock, X, ChevronLeft, AlertTriangle } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';
import { usePurchase } from '../context/PurchaseContext';

// Valid sale types
const VALID_SALE_TYPES = ['seated', 'general'];

// This page is ONLY for seated events (saleType = "seated")
// General events should NOT use this page - they use TicketSelection modal instead

const SeatsSelectionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = mockEvents[id] || mockEvents['1'];
  
  const { 
    selectEvent, 
    selectedFunction,
    selectFunction,
    addSeat, 
    removeSeat, 
    selectedSeats, 
    formatPrice,
    serviceFee: contextServiceFee
  } = usePurchase();
  
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  // Validate saleType
  const hasValidSaleType = VALID_SALE_TYPES.includes(event.saleType);
  const isSeatedEvent = event.saleType === 'seated';
  const hasMultipleFunctions = event.functions && event.functions.length > 1;
  const hasSingleFunction = event.functions && event.functions.length === 1;

  // Redirect if this is not a seated event or saleType is invalid
  useEffect(() => {
    if (!hasValidSaleType || !isSeatedEvent) {
      console.error(
        `[ProntoTicketLive] SeatsSelectionPage: Invalid access.`,
        `\nEvent saleType: "${event.saleType}"`,
        `\nThis page requires saleType = "seated".`,
        `\nRedirecting to event page.`
      );
      navigate(`/evento/${id}`);
      return;
    }
    
    // Redirect if multi-function event has no function selected
    if (hasMultipleFunctions && !selectedFunction) {
      console.error(
        `[ProntoTicketLive] SeatsSelectionPage: No function selected for multi-function event.`,
        `\nRedirecting to event page to select a function.`
      );
      navigate(`/evento/${id}`);
    }
  }, [event, id, navigate, hasValidSaleType, isSeatedEvent, hasMultipleFunctions, selectedFunction]);

  // Set event in context when component mounts
  useEffect(() => {
    selectEvent(event);
  }, [id, event, selectEvent]);

  // Auto-select function if event has only one
  useEffect(() => {
    if (hasSingleFunction && !selectedFunction) {
      const singleFunc = event.functions[0];
      selectFunction(singleFunc);
    }
  }, [hasSingleFunction, selectedFunction, event.functions, selectFunction]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const total = subtotal + (selectedSeats.length > 0 ? contextServiceFee : 0);

  const handleBackToEvent = () => {
    navigate(`/evento/${id}`);
  };

  const handleContinueToSummary = () => {
    if (selectedSeats.length > 0) {
      navigate(`/evento/${id}/resumen`);
    }
  };

  // Mock function to simulate seat selection (would be triggered by Seats.io)
  // In real implementation, seats would be loaded for the specific selectedFunction.id
  const mockAddSeat = () => {
    const seatNumber = Math.floor(Math.random() * 20) + 1;
    const row = String.fromCharCode(65 + Math.floor(Math.random() * 5)); // A-E
    const mockSeat = {
      id: `seat-${Date.now()}`,
      number: `${row}${seatNumber}`,
      seat: `${row}${seatNumber}`,
      section: 'Platea A',
      row: row,
      price: 1200,
      // Include function reference for seat validation
      functionId: selectedFunction?.id || null
    };
    addSeat(mockSeat);
  };

  const handleRemoveSeat = (seatId) => {
    removeSeat(seatId);
  };

  // Block seat selection if no function is selected (for multi-function events)
  const canSelectSeats = !hasMultipleFunctions || selectedFunction !== null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      
      {/* Event Summary Bar - Sticky */}
      <div className="sticky top-20 z-40 bg-[#121212] border-b border-white/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Event Thumbnail */}
              <img 
                src={event.image} 
                alt={event.title}
                className="w-16 h-16 rounded-lg object-cover hidden sm:block"
              />
              
              {/* Event Info */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div>
                  <h2 className="text-white font-bold text-sm sm:text-base line-clamp-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {event.title}
                  </h2>
                  {/* Display selected function date/time */}
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
                  <span>{event.venue}</span>
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-2 bg-[#FF9500]/10 border border-[#FF9500]/30 rounded-lg px-3 py-2">
              <Clock size={16} className="text-[#FF9500]" />
              <span className="text-[#FF9500] font-bold text-sm sm:text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          
          {/* Selected Function Badge - Only show for multi-function events */}
          {hasMultipleFunctions && selectedFunction && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <span className="text-white/50 text-xs uppercase tracking-wide">Función:</span>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Seating Map */}
          <div className="lg:col-span-2">
            <div className="bg-[#121212] rounded-3xl border border-white/10 p-6 shadow-2xl">
              <h2 
                className="text-2xl font-bold text-white mb-6 tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Selecciona tus asientos
              </h2>

              {/* Seats.io Map Placeholder */}
              <div 
                className="relative w-full bg-[#1E1E1E] rounded-2xl border-2 border-[#007AFF]/30 overflow-hidden"
                style={{ minHeight: '500px', height: '60vh' }}
                data-testid="seatsio-map-container"
              >
                {/* Placeholder content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 rounded-full bg-[#007AFF]/10 border-2 border-[#007AFF]/30 flex items-center justify-center mx-auto mb-4">
                      <MapPin size={32} className="text-[#007AFF]" />
                    </div>
                    <p className="text-white/70 text-lg mb-2">
                      Aquí se mostrará el mapa interactivo de asientos
                    </p>
                    <p className="text-white/40 text-sm">
                      (Integración con Seats.io)
                    </p>
                  </div>

                  {/* Mock selection button for demo */}
                  <button
                    onClick={mockAddSeat}
                    className="px-6 py-2 bg-[#007AFF] hover:bg-[#0056b3] text-white text-sm font-semibold rounded-full transition-all duration-200"
                  >
                    Simular selección de asiento
                  </button>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-[#007AFF]/10 blur-3xl" />
                </div>
              </div>

              {/* Legend */}
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

          {/* RIGHT COLUMN - Selection Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-40">
              <div className="bg-[#121212] rounded-3xl border border-white/10 p-6 shadow-2xl">
                <h3 
                  className="text-xl font-bold text-white mb-4 tracking-tight"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Tus asientos seleccionados
                </h3>

                {/* Selected Seats List */}
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
                          <div className="text-white/50 text-xs">{seat.section} - Fila {seat.row}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-[#FF9500] font-bold">{formatPrice(seat.price)}</span>
                          <button
                            onClick={() => handleRemoveSeat(seat.id)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            data-testid={`remove-seat-${seat.id}`}
                          >
                            <X size={16} className="text-white/60" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pricing Summary */}
                <div className="space-y-3 pt-4 border-t border-white/10 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Subtotal</span>
                    <span className="text-white font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  {selectedSeats.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Cargo por servicio</span>
                      <span className="text-white font-semibold">{formatPrice(contextServiceFee)}</span>
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

                {/* Primary CTA */}
                <button
                  onClick={handleContinueToSummary}
                  disabled={selectedSeats.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 mb-3"
                  data-testid="continue-to-payment-button"
                >
                  Ver resumen de compra
                </button>

                {/* Secondary Action */}
                <button
                  onClick={handleBackToEvent}
                  className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors flex items-center justify-center space-x-2"
                  data-testid="back-to-event-button"
                >
                  <ChevronLeft size={18} />
                  <span>Volver al evento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacing before footer */}
      <div className="h-20" />

      <Footer />
    </div>
  );
};

export default SeatsSelectionPage;
