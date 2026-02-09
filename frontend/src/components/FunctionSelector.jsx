import React from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

const FunctionSelector = ({ functions, selectedFunction, onSelectFunction }) => {
  return (
    <div className="space-y-4 mb-8 pb-8 border-b border-white/10">
      <h3 
        className="text-xl font-bold text-white tracking-tight"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        Selecciona una función
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {functions.map((func) => {
          const isSelected = selectedFunction?.id === func.id;
          const isLowAvailability = func.availability === 'Pocas entradas';
          
          return (
            <button
              key={func.id}
              onClick={() => onSelectFunction(func)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-[#007AFF] bg-[#007AFF]/10'
                  : 'border-white/10 bg-[#1E1E1E] hover:border-white/20 hover:bg-[#1E1E1E]/80'
              }`}
              data-testid={`function-option-${func.id}`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 size={20} className="text-[#007AFF]" strokeWidth={2.5} />
                </div>
              )}

              {/* Date and Time */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-[#007AFF] flex-shrink-0" strokeWidth={2} />
                  <span className="text-white font-semibold text-sm">{func.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-[#FF9500] flex-shrink-0" strokeWidth={2} />
                  <span className="text-white font-semibold text-sm">{func.time} hrs</span>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isLowAvailability ? 'bg-[#FF9500]' : 'bg-green-500'
                  }`}
                />
                <span 
                  className={`text-xs font-medium ${
                    isLowAvailability ? 'text-[#FF9500]' : 'text-green-500'
                  }`}
                >
                  {func.availability}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {!selectedFunction && (
        <p className="text-white/50 text-sm">
          Selecciona una función para continuar con la compra
        </p>
      )}
    </div>
  );
};

export default FunctionSelector;
