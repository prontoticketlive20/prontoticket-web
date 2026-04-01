import React, { useEffect } from "react";
import { ShieldCheck, Ticket, Sparkles, Users, Globe, ArrowRight } from "lucide-react";
import Footer from "../components/Footer";

export default function NosotrosPage() {
  useEffect(() => {
    document.title = "Nosotros | ProntoTicketLive";
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#111827] via-[#0A0A0A] to-[#0A0A0A]">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#007AFF]/30 blur-3xl" />
          <div className="absolute top-16 right-0 w-80 h-80 rounded-full bg-[#FF9500]/20 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#007AFF]/20 bg-[#007AFF]/10 px-4 py-2 text-sm text-[#7fb6ff] mb-6">
            <Sparkles size={16} />
            Plataforma tecnológica para boletos y experiencias en vivo
          </div>

          <h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Nosotros
          </h1>

          <p className="mt-6 max-w-3xl text-white/70 text-lg md:text-xl leading-relaxed">
            En <span className="text-white font-semibold">ProntoTicketLive.com</span> conectamos
            a las personas con experiencias en vivo a través de una plataforma moderna, segura y
            diseñada para ofrecer un proceso de compra fácil, rápido y confiable.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/terminos"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#007AFF] to-[#005BEA] px-6 py-3 font-semibold text-white hover:brightness-110 transition"
            >
              Ver políticas y términos
              <ArrowRight size={16} />
            </a>

            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/80 hover:bg-white/10 transition"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="rounded-3xl border border-white/10 bg-[#111111] p-6 md:p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#4ea1ff] mb-5">
              <Ticket size={22} />
            </div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Qué hacemos
            </h2>
            <p className="text-white/70 leading-7">
              Comercializamos boletos digitales para conciertos, espectáculos, teatro, deportes,
              experiencias especiales y eventos organizados por terceros, ofreciendo una operación
              ágil desde la venta hasta el control de acceso mediante códigos QR y validación en tiempo real.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111111] p-6 md:p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF9500]/10 text-[#FFB347] mb-5">
              <ShieldCheck size={22} />
            </div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Nuestro compromiso
            </h2>
            <p className="text-white/70 leading-7">
              Trabajamos para garantizar seguridad en las transacciones, transparencia en el proceso
              de compra, protección de la información del usuario y herramientas confiables para organizadores,
              productores y operadores de acceso.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111111] p-6 md:p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#4ea1ff] mb-5">
              <Users size={22} />
            </div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              A quién servimos
            </h2>
            <p className="text-white/70 leading-7">
              Atendemos tanto al público que busca una experiencia de compra moderna como a productores
              y organizadores que requieren una solución tecnológica sólida para vender, gestionar y validar
              entradas de manera profesional.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111111] p-6 md:p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF9500]/10 text-[#FFB347] mb-5">
              <Globe size={22} />
            </div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Nuestra visión
            </h2>
            <p className="text-white/70 leading-7">
              Convertirnos en una plataforma global de entretenimiento, integrando venta de boletos,
              experiencias, validación digital y alianzas estratégicas con el ecosistema turístico,
              hotelero y de transporte.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-4xl">
            <h2
              className="text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              ProntoTicketLive.com
            </h2>

            <div className="space-y-6 text-white/75 leading-8">
              <p>
                Contamos con experiencia en la industria del entretenimiento y trabajamos para brindar
                una experiencia de compra intuitiva, confiable y alineada con las expectativas del mercado actual.
              </p>

              <p>
                Nuestra infraestructura digital está pensada para facilitar la venta online, la emisión
                de boletos electrónicos, la validación mediante QR y la supervisión operativa de cada evento.
              </p>

              <p>
                Creemos en el poder del entretenimiento para conectar personas, generar emociones y construir
                experiencias memorables. Por eso desarrollamos una plataforma enfocada en eficiencia, seguridad y crecimiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}