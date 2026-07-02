import React from "react";

export default function VenezuelaSupportBanner() {
  return (
    <div className="w-full mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0A0A0A] to-[#111827] border border-yellow-500/20 rounded-xl p-4 shadow-lg">
        
        {/* IZQUIERDA */}
        <div className="flex items-start gap-3">
          <div className="text-xl">❤️</div>

          <div>
            <p className="text-white font-semibold text-sm">
              Apoyamos a Venezuela 🇻🇪
            </p>

            <p className="text-white/70 text-xs leading-relaxed">
              Por cada boleto vendido fuera de Venezuela, destinamos un
              porcentaje del fee a ayuda directa.
            </p>
          </div>
        </div>

        {/* DERECHA */}
        <button
          onClick={() => {
            if (window.openVenezuelaSupportModal) {
              window.openVenezuelaSupportModal();
            }
          }}
          className="text-xs text-yellow-400 hover:text-yellow-300 transition px-2 py-1 rounded-md hover:bg-white/5"
        >
          Ver más
        </button>
      </div>
    </div>
  );
}