
import React from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Gift,
  Ticket,
  ScanLine,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

// ==========================================
// SECCIONES DEL PROGRAMA DE BENEFICIOS
// ==========================================

const sections = [
  {
    title: "Comercios",
    description:
      "Registro y administración de los comercios participantes en el programa.",
    icon: Store,
    path: "/admin/beneficios/comercios",
    available: true,
  },
  
  {
    title: "Promociones",
    description:
     "Configuración de beneficios globales o asociados a eventos específicos.",
    icon: Gift,
    path: "/admin/beneficios/promociones",
    available: true,
  },

  {
    title: "Cupones",
    description:
      "Consulta de cupones generados, disponibilidad y estados.",
    icon: Ticket,
    path: null,
    available: false,
  },
  {
    title: "Canjes",
    description:
      "Seguimiento de los beneficios utilizados y su historial de redenciones.",
    icon: ScanLine,
    path: null,
    available: false,
  },
];

// ==========================================
// TARJETA DE NAVEGACION
// ==========================================

function BenefitSectionCard({ section }) {
  const Icon = section.icon;

  const content = (
    <>
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/15 mb-4">
        <Icon
          size={24}
          className="text-[#007AFF]"
        />
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {section.title}
      </h3>

      <p className="text-sm text-white/50 leading-relaxed flex-1">
        {section.description}
      </p>

      <div className="mt-5 pt-4 border-t border-white/10">
        {section.available ? (
          <div className="flex items-center justify-between gap-3">
            
          <span className="text-xs text-[#007AFF] font-semibold">
           {`Administrar ${section.title.toLowerCase()}`}
          </span>

            <ArrowRight
              size={19}
              className="text-[#007AFF]"
            />
          </div>
        ) : (
          <span className="text-xs text-[#FF9500] font-semibold">
            Próximamente
          </span>
        )}
      </div>
    </>
  );

  const baseClassName =
    "rounded-2xl bg-[#111111] border border-white/10 p-5 " +
    "flex flex-col min-h-[220px] transition-all duration-200";

  if (section.available && section.path) {
    return (
      <Link
        to={section.path}
        className={
          baseClassName +
          " cursor-pointer hover:border-[#007AFF]/60 " +
          "hover:bg-[#007AFF]/5 " +
          "focus:outline-none focus-visible:ring-2 " +
          "focus-visible:ring-[#007AFF] " +
          "active:scale-[0.99]"
        }
        aria-label={`Abrir administración de ${section.title}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={baseClassName}
      aria-disabled="true"
    >
      {content}
    </div>
  );
}

// ==========================================
// PAGINA PRINCIPAL DE BENEFICIOS
// ==========================================

export default function BeneficiosPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ENCABEZADO */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">

            <div className="p-3 rounded-2xl bg-[#007AFF]/15 border border-[#007AFF]/20">
              <Gift
                size={25}
                className="text-[#007AFF]"
              />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                ProntoTicket Beneficios
              </h1>

              <p className="text-white/50 text-sm mt-1">
                Panel de administración · Versión 1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 border border-white/10 px-4 py-3 rounded-xl">
            <ShieldCheck
              size={17}
              className="text-[#FF9500]"
            />
            Administración de beneficios
          </div>
        </div>

        {/* INTRODUCCION */}

        <div className="rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/5 p-5">
          <h2 className="text-lg font-semibold mb-2">
            Programa de Beneficios
          </h2>

          <p className="text-sm text-white/60 leading-relaxed">
            Administra los comercios aliados y las promociones
            que podrán generar cupones para compradores de
            eventos elegibles en ProntoTicketLive.
          </p>
        </div>

        {/* MODULOS ADMINISTRATIVOS */}

        <section>
          <h2 className="text-lg font-bold mb-4">
            Administración del programa
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {sections.map((section) => (
              <BenefitSectionCard
                key={section.title}
                section={section}
              />
            ))}
          </div>
        </section>

      </div>
    </AdminLayout>
  );
}
