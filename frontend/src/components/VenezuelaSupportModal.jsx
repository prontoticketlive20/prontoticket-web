import React, { useEffect, useState } from "react";
import ticky from "../assets/ticky-support.png";

export default function VenezuelaSupportModal() {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 🔥 ABRIR DESDE EL BANNER
    window.openVenezuelaSupportModal = () => {
      setShow(true);
      setTimeout(() => setVisible(true), 50);
    };

    const seen = localStorage.getItem("ptl_venezuela_support_seen");

    if (!seen) {
      setShow(true);

      setTimeout(() => {
        setVisible(true);
      }, 300);

      localStorage.setItem("ptl_venezuela_support_seen", "true");
    }

    return () => {
      delete window.openVenezuelaSupportModal;
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setShow(false), 250);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? "bg-black/70 backdrop-blur-sm" : "bg-black/0"
      }`}
    >
      <div
        className={`w-full max-w-sm mx-4 rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl p-6 transform transition-all duration-300 ${
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* 🔥 HEADER CON TICKY */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={ticky}
            alt="Ticky"
            className="w-12 h-12 object-contain"
          />

          <div>
            <p className="text-white text-sm font-semibold">
              Estamos contigo 🇻🇪
            </p>
            <p className="text-white/50 text-xs">
              Iniciativa solidaria
            </p>
          </div>
        </div>

        {/* 🔥 MENSAJE */}
        <p className="text-white/70 text-sm leading-relaxed mb-6">
          Por cada boleto que adquirido fuera de Venezuela, destinaremos un porcentaje del fee a la ayuda directa para quienes más lo necesitan.
        </p>

        {/* 🔥 BOTÓN */}
        <button
          onClick={handleClose}
          className="w-full bg-white text-black py-2 rounded-full font-semibold hover:scale-[1.03] transition"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}