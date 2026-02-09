import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import TicketSelection from './TicketSelection';
import FunctionSelector from './FunctionSelector';
import { Calendar, MapPin, Clock, Users, Info, AlertCircle, Mail, Phone, AlertTriangle } from 'lucide-react';
import { mockEvents, getEventPolicies } from '../data/mockEvents';
import { usePurchase } from '../context/PurchaseContext';

// Valid sale types
const VALID_SALE_TYPES = ['seated', 'general'];

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showTicketSelection, setShowTicketSelection] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);
  
  const { selectEvent, selectFunction: setContextFunction } = usePurchase();
  
  const event = mockEvents[id] || mockEvents['1'];
  const policies = getEventPolicies(id || '1');
  
  // Validate saleType
  const hasValidSaleType = VALID_SALE_TYPES.includes(event.saleType);
  const isSeatedEvent = event.saleType === 'seated';
  const isGeneralEvent = event.saleType === 'general';
  
  // Developer warning for invalid saleType
  useEffect(() => {
    if (!hasValidSaleType) {
      console.error(
        `[ProntoTicketLive] Invalid or missing saleType for event "${event.title}" (ID: ${event.id}).`,
        `\nReceived: "${event.saleType}"`,
        `\nExpected: "seated" | "general"`,
        `\nPurchase flow is BLOCKED until this is fixed.`
      );
    }
  }, [event, hasValidSaleType]);
  
  const hasMultipleFunctions = event.functions && event.functions.length > 1;
  
  // Can only proceed if saleType is valid AND (no multiple functions OR function selected)
  const canProceed = hasValidSaleType && (!hasMultipleFunctions || selectedFunction !== null);

  // Set event in context when component mounts or id changes
  useEffect(() => {
    selectEvent(event);
  }, [id, event, selectEvent]);

  // Update context when function is selected
  useEffect(() => {
    if (selectedFunction) {
      setContextFunction(selectedFunction);
    }
  }, [selectedFunction, setContextFunction]);

  const handleSelectTickets = () => {
    // Block if saleType is invalid
    if (!hasValidSaleType) {
      console.error('[ProntoTicketLive] Purchase blocked: Invalid saleType');
      return;
    }
    
    if (!canProceed) return;
    
    // ONLY ONE flow can execute based on saleType
    if (isSeatedEvent) {
      // Seated events: Go directly to seat selection (no ticket modal)
      navigate(`/evento/${id}/asientos`);
    } else if (isGeneralEvent) {
      // General events: Show ticket type/quantity selection modal
      setShowTicketSelection(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      
      {/* Event Hero */}
      <div className="relative h-[50vh] min-h-[400px] mt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${event.image}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
      </div>

      {/* Event Content */}
      <div className="relative -mt-32 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#121212] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            
            {/* Event Cover Image */}
            <div className="relative w-full aspect-[21/9] overflow-hidden">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Event Content */}
            <div className="p-8 md:p-12">
              {/* Event Header */}
              <div className="space-y-6 mb-8 pb-8 border-b border-white/10">
                <h1 
                  className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                  data-testid="event-title"
                >
                  {event.title}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="text-[#007AFF] flex-shrink-0 mt-1" size={20} strokeWidth={2} />
                    <div>
                      <div className="text-white font-semibold">{event.date}</div>
                      <div className="text-white/60 text-sm">{event.time} hrs</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="text-[#FF9500] flex-shrink-0 mt-1" size={20} strokeWidth={2} />
                    <div>
                      <div className="text-white font-semibold">{event.venue}</div>
                      <div className="text-white/60 text-sm">{event.location}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                  <div>
                    <div className="text-sm text-white/50 uppercase tracking-wide mb-1">Precio desde</div>
                    <div className="text-4xl font-bold text-[#FF9500] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      ${event.startingPrice}
                    </div>
                  </div>
                  <button
                    onClick={handleSelectTickets}
                    disabled={!canProceed}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-base font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[0_8px_30px_rgba(0,122,255,0.6)] active:scale-95 tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="select-tickets-button"
                  >
                    {isSeatedEvent ? 'Seleccionar asientos' : 'Seleccionar entradas'}
                  </button>
                </div>
              </div>

              {/* Function Selector - Only shown for multi-function events */}
              {hasMultipleFunctions && (
                <FunctionSelector
                  functions={event.functions}
                  selectedFunction={selectedFunction}
                  onSelectFunction={setSelectedFunction}
                />
              )}}

              {/* Description */}
              <div className="space-y-6 mb-8 pb-8 border-b border-white/10">
                <h2 
                  className="text-2xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Descripción del evento
                </h2>
                <p className="text-white/70 leading-relaxed text-base">
                  {event.description}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-white/10">
                <div className="flex items-start space-x-3">
                  <Clock className="text-[#007AFF] flex-shrink-0 mt-1" size={18} strokeWidth={2} />
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Puertas abren</div>
                    <div className="text-white font-semibold">{event.doors} hrs</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="text-[#FF9500] flex-shrink-0 mt-1" size={18} strokeWidth={2} />
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Edad mínima</div>
                    <div className="text-white font-semibold">{event.ageLimit}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Info className="text-[#007AFF] flex-shrink-0 mt-1" size={18} strokeWidth={2} />
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Duración</div>
                    <div className="text-white font-semibold">{event.duration}</div>
                  </div>
                </div>
              </div>

              {/* Policies */}
              <div className="space-y-4 mb-8 pb-8 border-b border-white/10">
                <h3 
                  className="text-xl font-bold text-white tracking-tight flex items-center space-x-2"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  <AlertCircle className="text-[#FF9500]" size={22} strokeWidth={2} />
                  <span>Políticas del evento</span>
                </h3>
                <ul className="space-y-2">
                  {policies.map((policy, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-[#007AFF] mt-1">•</span>
                      <span className="text-white/70 text-sm">{policy}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Producer Contact */}
              {event.producerContact && (
                <div className="space-y-3 mb-8 pb-8 border-b border-white/10">
                  <p className="text-sm text-white/60 tracking-wide">
                    ¿Quieres contactar o preguntar algo al productor del evento?
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Mail size={16} className="text-[#007AFF] flex-shrink-0" strokeWidth={2} />
                      <a 
                        href={`mailto:${event.producerContact.email}`}
                        className="text-white/70 hover:text-[#007AFF] transition-colors duration-200 text-sm"
                      >
                        {event.producerContact.email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone size={16} className="text-[#FF9500] flex-shrink-0" strokeWidth={2} />
                      <a 
                        href={`tel:${event.producerContact.phone}`}
                        className="text-white/70 hover:text-[#FF9500] transition-colors duration-200 text-sm"
                      >
                        {event.producerContact.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Promotional Video */}
              <div className="space-y-4">
                <h3 
                  className="text-xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Video promocional del evento
                </h3>
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#1E1E1E] border border-white/10">
                  <iframe
                    src={`https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&showinfo=0`}
                    title="Video promocional del evento"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    data-testid="event-promo-video"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Sticky CTA */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 p-4 z-40">
            <button
              onClick={handleSelectTickets}
              disabled={!canProceed}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-base font-bold rounded-full shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="mobile-select-tickets-button"
            >
              {isSeatedEvent ? 'Seleccionar asientos' : 'Seleccionar entradas'}
            </button>
          </div>
        </div>
      </div>

      <div className="h-20" />

      <Footer />

      {/* Ticket Selection Modal - ONLY for general events */}
      {showTicketSelection && !isSeatedEvent && (
        <TicketSelection 
          event={event}
          onClose={() => setShowTicketSelection(false)}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
