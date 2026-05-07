import React, { useState } from "react";
import { MessageCircle, X, Ticket, Mail, CreditCard, HelpCircle, Headphones } from "lucide-react";
import icono2026 from "../assets/icono_2026.png";

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

const openWhatsAppSupport = () => {
  const currentUrl = window.location.href;

  let storedEvent = null;

  try {
    storedEvent = JSON.parse(
      localStorage.getItem("ptl_support_event_context") || "null"
    );
  } catch {
    storedEvent = null;
  }

  const pageTitle = document.querySelector("h1")?.innerText || "";

  const genericTitles = [
    "Resumen de Compra",
    "Checkout",
    "Seleccionar asientos",
    "Selección de asientos",
  ];

  const eventTitle =
    genericTitles.includes(pageTitle)
      ? storedEvent?.title || "No identificado"
      : pageTitle || storedEvent?.title || "No identificado";

  const eventUrl =
    storedEvent?.url ||
    currentUrl;

  const message =
`Hola ProntoTicketLive 👋

Necesito ayuda con la plataforma.

📍 Página actual:
${currentUrl}

🔗 Evento relacionado:
${eventUrl}

🎟 Evento:
${eventTitle}`;

  const encoded = encodeURIComponent(message);

  window.open(
    `https://wa.me/14073604497?text=${encoded}`,
    "_blank"
  );
};

  const options = [
    {
      key: "tickets",
      icon: <Ticket size={18} />,
      title: "No recibí mis tickets",
      answer:
`Si realizaste tu compra correctamente, puedes recuperar tus tickets iniciando sesión o registrándote con el mismo email usado en la compra.

Luego entra en:
👉 Mi Cuenta
👉 Mis Compras
👉 Ver Tickets

Desde allí podrás acceder a tus QR, visualizar tus tickets y revisar tus órdenes activas.`,
    },
    {
      key: "payment",
      icon: <CreditCard size={18} />,
      title: "Problema con mi pago",
      answer:
`Si presentaste algún inconveniente durante el pago, te recomendamos verificar primero si recibiste un email de confirmación de compra.

Algunos pagos pueden tardar unos minutos en procesarse dependiendo del banco o método utilizado.

Si el problema continúa, puedes contactar directamente a nuestro equipo de soporte para ayudarte a validar tu orden.`,
    },
    {
      key: "buy",
      icon: <HelpCircle size={18} />,
      title: "Cómo comprar",
      answer:
`Comprar en ProntoTicketLive es facil, rápido y seguro:

1️⃣ Selecciona el evento
2️⃣ Elige tus tickets o asientos
3️⃣ Completa el pago
4️⃣ Recibe tus tickets digitales al instante

También puedes acceder a tus compras desde tu cuenta en cualquier momento.`,
    },
    {
      key: "support",
      icon: <Headphones size={18} />,
      title: "Contactar soporte",
      answer:
`Nuestro equipo de soporte está disponible para ayudarte con compras, tickets, accesos o cualquier duda relacionada con la plataforma. Puedes escribir a sales@prontoticketlive.com

Puedes contactarnos directamente por WhatsApp usando el botón inferior, en horario de oficina.`,
    },
    

  ];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white rounded-full px-5 py-4 shadow-2xl shadow-blue-500/30 flex items-center gap-2 font-semibold hover:brightness-110 active:scale-95 transition"
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline">Ayuda</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm rounded-3xl border border-white/10 bg-[#111111] text-white shadow-2xl overflow-hidden">
          <div className="bg-black px-5 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
    <img
      src={icono2026}
      alt="ProntoTicketLive"
      className="w-8 h-8 object-contain"
    />
  </div>

  <div>
    <div className="font-bold text-lg">Soporte ProntoTicketLive</div>
    <div className="text-xs text-white/50">¿En qué podemos ayudarte?</div>
  </div>
</div>

            <button
              onClick={() => {
                setOpen(false);
                setSelected(null);
              }}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {!selected ? (
              options.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                   if (item.action) {
                    item.action();
                 } else {
               setSelected(item);
                }
               }}
                  className="w-full text-left rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition flex gap-3 items-start"
                >
                  <div className="text-[#FF9500] mt-0.5">{item.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-xs text-white/45 mt-1">
                      Toca para ver ayuda
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-sm text-[#4da3ff] mb-4 hover:text-white"
                >
                  ← Volver
                </button>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-[#FF9500] mb-3">
                    {selected.icon}
                    <h3 className="font-bold">{selected.title}</h3>
                  </div>

                  <p className="text-sm text-white/70 leading-relaxed">
                    {selected.answer}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-black/60">
  <div className="p-4">
    <button
      onClick={openWhatsAppSupport}
      className="w-full rounded-2xl bg-gradient-to-r from-[#25D366] to-[#1ebe5d] text-white py-3 font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition shadow-lg shadow-green-500/20"
    >
      <MessageCircle size={18} />
      <span>Hablar con soporte ahora</span>
    </button>
  </div>

  <div className="px-5 pb-3 text-[11px] text-white/40 text-center">
    ProntoTicketLive • Fácil, Rápido y Seguro
  </div>
</div>
        </div>
      )}
    </>
  );
}