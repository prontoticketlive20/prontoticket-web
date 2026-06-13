import React, { useState, useEffect } from "react";
import { MessageCircle, X, Ticket, CreditCard, HelpCircle, Headphones } from "lucide-react";
import tickyAvatar from "../assets/ticky-avatar.png";
import tickyPro from "../assets/ticky-pro.png";

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showTyping, setShowTyping] = useState(true);

  useEffect(() => {
    if (open) {
      setShowTyping(true);

      const timer = setTimeout(() => {
        setShowTyping(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [open]);

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
`Hola 👋 Soy cliente de ProntoTicketLive

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
`Comprar en ProntoTicketLive es fácil, rápido y seguro:

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
`Nuestro equipo de soporte está disponible para ayudarte con compras, tickets, accesos o cualquier duda relacionada con la plataforma.

Puedes contactarnos directamente por WhatsApp usando el botón inferior.`,
    },
  ];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white rounded-full px-4 py-3 shadow-2xl shadow-blue-500/30 flex items-center gap-3 font-semibold hover:brightness-110 active:scale-95 transition"
        >
          <img
            src={tickyAvatar}
            alt="Ticky"
            className="w-9 h-9 rounded-full object-cover border border-white/20"
          />
          <span className="hidden sm:inline">Habla con Ticky</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm rounded-3xl border border-white/10 bg-[#111111] text-white shadow-2xl overflow-hidden">

          {/* HEADER */}
          <div className="bg-black px-5 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20">
                <img
                  src={tickyPro}
                  alt="Ticky"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="font-bold text-lg">Ticky • Soporte</div>
                <div className="text-xs text-white/50">¿En qué puedo ayudarte?</div>
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

          {/* CONTENIDO */}
          <div className="p-4 space-y-3">

            {!selected && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start gap-3">

                  <img
                    src={tickyAvatar}
                    alt="Ticky"
                    className="w-8 h-8 rounded-full object-cover"
                  />

                  <div className="text-sm text-white/80 leading-relaxed">

                    {showTyping ? (
                      <div className="flex items-center gap-2 text-white/60">
                        <span className="text-xs">Ticky está escribiendo</span>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <strong className="text-white">👋 ¡Hola! Soy Ticky</strong>
                        <br />
                        Estoy aquí para ayudarte con tus tickets, compras o cualquier duda.
                        <br />
                        <span className="text-white/60">¿En qué puedo ayudarte hoy?</span>
                      </>
                    )}

                  </div>
                </div>
              </div>
            )}

            {!selected ? (
              options.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSelected(item)}
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

          {/* FOOTER */}
          <div className="border-t border-white/10 bg-black/60">
            <div className="p-4">
              <button
                onClick={openWhatsAppSupport}
                className="w-full rounded-2xl bg-gradient-to-r from-[#25D366] to-[#1ebe5d] text-white py-3 font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition shadow-lg shadow-green-500/20"
              >
                <MessageCircle size={18} />
                <span>Hablar con Ticky ahora</span>
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