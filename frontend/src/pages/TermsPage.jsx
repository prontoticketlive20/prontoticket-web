import React, { useEffect } from "react";
import { FileText, Shield, Receipt, Ticket, RefreshCcw, AlertTriangle } from "lucide-react";
import Footer from "../components/Footer";

const Section = ({ icon: Icon, title, children }) => (
  <div className="rounded-3xl border border-white/10 bg-[#111111] p-6 md:p-8">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#4ea1ff] mb-5">
      <Icon size={22} />
    </div>
    <h2
      className="text-2xl font-bold mb-4"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {title}
    </h2>
    <div className="space-y-4 text-white/70 leading-7">{children}</div>
  </div>
);

export default function TermsPage() {
  useEffect(() => {
    document.title = "Términos y Condiciones | ProntoTicketLive";
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#111827] via-[#0A0A0A] to-[#0A0A0A]">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#007AFF]/30 blur-3xl" />
          <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-[#FF9500]/20 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF9500]/20 bg-[#FF9500]/10 px-4 py-2 text-sm text-[#FFB347] mb-6">
            <FileText size={16} />
            Documento informativo y normativo de uso de la plataforma
          </div>

          <h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Términos y Condiciones
          </h1>

          <p className="mt-6 max-w-4xl text-white/70 text-lg md:text-xl leading-relaxed">
            Al acceder y utilizar <span className="text-white font-semibold">ProntoTicketLive.com</span>,
            el usuario acepta los presentes términos y condiciones, así como las políticas aplicables al uso de
            la plataforma y a la compra de boletos digitales.
          </p>

          <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100/90 max-w-4xl">
            Este documento está redactado con fines informativos y operativos. Se recomienda revisión legal final
            antes de considerarlo como versión definitiva pública.
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 gap-6">
          <Section icon={Shield} title="1. Uso de la plataforma">
            <p>
              ProntoTicketLive.com es una plataforma digital destinada a la comercialización, emisión
              y gestión de boletos para eventos, espectáculos y experiencias organizadas por terceros.
            </p>
            <p>
              El usuario se compromete a utilizar el sitio de forma lícita, responsable y conforme a las
              disposiciones aquí establecidas.
            </p>
          </Section>

          <Section icon={Receipt} title="2. Compra de boletos">
            <p>
              Todas las compras están sujetas a disponibilidad. Los precios exhibidos pueden incluir
              cargos por servicio, tarifas operativas e impuestos aplicables.
            </p>
            <p>
              Antes de completar el pago, el usuario debe verificar cuidadosamente la información del evento,
              fecha, hora, sede, cantidad de boletos y demás condiciones relacionadas con la compra.
            </p>
            <p>
              Una vez completado el proceso de compra y confirmado el pago, el usuario recibirá sus boletos
              en formato digital.
            </p>
          </Section>

          <Section icon={Ticket} title="3. Validez y uso de los boletos">
            <p>
              Cada boleto emitido por la plataforma es único y podrá ser validado una sola vez en el acceso al evento,
              salvo disposición expresa del organizador.
            </p>
            <p>
              La reproducción, alteración, manipulación, reventa no autorizada o uso fraudulento de un boleto podrá
              ocasionar su anulación sin derecho a reembolso.
            </p>
            <p>
              El acceso al evento está sujeto a la verificación y validación del boleto mediante los controles implementados
              por la plataforma y/o por el organizador del evento.
            </p>
          </Section>

          <Section icon={RefreshCcw} title="4. Cambios, cancelaciones y reembolsos">
            <p>
              Las políticas de cambios, cancelaciones, devoluciones y reembolsos dependen del organizador del evento y
              de las condiciones específicas aplicables a cada caso.
            </p>
            <p>
              En caso de cancelación o modificación sustancial del evento, ProntoTicketLive.com podrá procesar reembolsos
              o ajustes conforme a las instrucciones del organizador y a las condiciones informadas al usuario.
            </p>
            <p>
              Los cargos por servicio y costos operativos podrán o no ser reembolsables, según la naturaleza del evento,
              el método de pago y la política aplicable.
            </p>
          </Section>

          <Section icon={AlertTriangle} title="5. Limitación de responsabilidad">
            <p>
              ProntoTicketLive.com actúa como plataforma tecnológica e intermediaria para la venta y gestión de boletos.
              La realización del evento, su contenido, programación, artistas, horarios, sede, logística y demás aspectos
              relacionados dependen del organizador del evento.
            </p>
            <p>
              La plataforma no será responsable por cancelaciones, reprogramaciones, variaciones en el contenido,
              cambios operativos o decisiones adoptadas por el organizador, la sede o cualquier tercero involucrado.
            </p>
          </Section>

          <Section icon={Shield} title="6. Cuenta, seguridad y datos">
            <p>
              El usuario es responsable de la veracidad de la información suministrada y del uso adecuado de sus
              credenciales de acceso, cuando aplique.
            </p>
            <p>
              ProntoTicketLive.com implementa medidas razonables de seguridad para la protección de datos y transacciones,
              sin garantizar la inexistencia absoluta de incidentes técnicos, fallas de terceros o eventos de fuerza mayor.
            </p>
          </Section>

          <Section icon={FileText} title="7. Propiedad intelectual y modificaciones">
            <p>
              Todos los elementos visuales, textos, marcas, logotipos, diseños, interfaces y contenidos de la plataforma
              son propiedad de ProntoTicketLive.com o de sus respectivos titulares y no podrán ser utilizados sin autorización.
            </p>
            <p>
              ProntoTicketLive.com se reserva el derecho de actualizar, modificar o sustituir estos términos y condiciones
              en cualquier momento. Las versiones actualizadas entrarán en vigor desde su publicación en la plataforma.
            </p>
          </Section>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 md:p-8">
          <h3
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Contacto
          </h3>
          <p className="text-white/70 leading-7">
            Para consultas relacionadas con compras, boletos, validaciones o soporte operativo,
            el usuario podrá comunicarse a través de los canales oficiales disponibles en la plataforma.
          </p>

          <div className="mt-6 text-sm text-white/40">
            Última actualización: [colocar fecha de publicación]
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}