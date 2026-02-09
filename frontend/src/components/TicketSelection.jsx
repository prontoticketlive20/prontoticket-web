import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Ticket, Check } from 'lucide-react';
import { getTicketOptions } from '../data/mockEvents';
import { usePurchase } from '../context/PurchaseContext';

// This component is ONLY for general admission events (saleType = "general")
// Seated events should NOT use this component - they go directly to seat selection

const TicketSelection = ({ event, onClose }) => {
  const navigate = useNavigate();
  const { updateTickets } = usePurchase();
  const [selectedTickets, setSelectedTickets] = useState({});
  const [step, setStep] = useState(1);

  // Get ticket options (only available for general events)
  const options = getTicketOptions(event.id);

  const handleQuantityChange = (itemId, change) => {
    setSelectedTickets(prev => {
      const current = prev[itemId] || 0;
      const newQuantity = Math.max(0, Math.min(10, current + change));
      
      if (newQuantity === 0) {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      }
      
      return { ...prev, [itemId]: newQuantity };
    });
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    let total = 0;
    for (const itemId in selectedTickets) {
      const item = options.find(o => o.id === itemId);
      if (item) {
        total += item.price * selectedTickets[itemId];
      }
    }
    return total;
  };

  const handleContinue = () => {
    if (getTotalTickets() > 0) {
      setStep(2);
    }
  };

  const handleProceedToSummary = () => {
    // Convert selected tickets to array format for context
    const ticketsArray = Object.keys(selectedTickets).map(itemId => {
      const item = options.find(o => o.id === itemId);
      return {
        id: itemId,
        type: item.name,
        name: item.name,
        price: item.price,
        quantity: selectedTickets[itemId]
      };
    }).filter(t => t.quantity > 0);

    // Update context with selected tickets
    updateTickets(ticketsArray);

    // Close modal
    onClose();

    // Navigate based on event type
    if (hasSeating) {
      // For seated events, go to seat selection
      navigate(`/evento/${event.id}/asientos`);
    } else {
      // For general events, go directly to summary
      navigate(`/evento/${event.id}/resumen`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] rounded-3xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 
              className="text-2xl md:text-3xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {step === 1 ? 'Seleccionar entradas' : 'Confirmar selección'}
            </h2>
            <p className="text-white/60 text-sm mt-1">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-all duration-200"
            data-testid="close-ticket-selection"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-white/70 text-sm mb-6">
                {hasSeating 
                  ? 'Selecciona la sección y cantidad de entradas que deseas.' 
                  : 'Selecciona el tipo y cantidad de entradas que deseas.'}
              </p>

              {options.map((item) => (
                <div 
                  key={item.id}
                  className="bg-[#1E1E1E] rounded-2xl p-5 border border-white/5 hover:border-white/20 transition-all duration-200"
                  data-testid={`ticket-option-${item.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {item.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-[#FF9500] font-bold text-xl">${item.price}</span>
                        <span className="text-white/50">
                          {item.available > 0 ? `${item.available} disponibles` : 'Agotado'}
                        </span>
                      </div>
                    </div>

                    {item.available > 0 && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={!selectedTickets[item.id]}
                          className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                          data-testid={`decrease-${item.id}`}
                        >
                          <Minus size={18} className="text-white" />
                        </button>
                        
                        <span className="text-white font-bold w-8 text-center text-lg">
                          {selectedTickets[item.id] || 0}
                        </span>
                        
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          disabled={selectedTickets[item.id] >= 10 || selectedTickets[item.id] >= item.available}
                          className="p-2 rounded-full bg-[#007AFF] hover:bg-[#0056b3] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                          data-testid={`increase-${item.id}`}
                        >
                          <Plus size={18} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Check className="text-[#007AFF]" size={20} />
                  <span>Resumen de tu compra</span>
                </h3>
                
                <div className="space-y-3">
                  {Object.keys(selectedTickets).map((itemId) => {
                    const qty = selectedTickets[itemId];
                    const item = options.find(o => o.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <div>
                          <div className="text-white font-semibold">{item.name}</div>
                          <div className="text-white/50 text-sm">{qty} x ${item.price}</div>
                        </div>
                        <div className="text-[#FF9500] font-bold">${item.price * qty}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-2xl p-4">
                <p className="text-white/70 text-sm">
                  Al continuar, serás redirigido al proceso de pago seguro para completar tu compra.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6 bg-[#0A0A0A]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/50 text-sm uppercase tracking-wide">Total</div>
              <div className="text-3xl font-bold text-white tracking-tight flex items-baseline space-x-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <span>${getTotalPrice()}</span>
                {getTotalTickets() > 0 && (
                  <span className="text-base text-white/60 font-normal">
                    ({getTotalTickets()} {getTotalTickets() === 1 ? 'entrada' : 'entradas'})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3.5 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-all duration-300 border border-white/10"
                data-testid="back-button"
              >
                Volver
              </button>
            )}
            
            <button
              onClick={step === 1 ? handleContinue : handleProceedToPayment}
              disabled={getTotalTickets() === 0}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center space-x-2"
              data-testid="continue-button"
            >
              <Ticket size={20} />
              <span>{step === 1 ? 'Continuar' : (hasSeating ? 'Seleccionar asientos' : 'Ver resumen')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSelection;
