import React, { useState, useEffect } from "react";
import { Mail, User, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import Footer from "../components/Footer";

export default function ContactoPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = "Contacto | ProntoTicketLive";
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const subject = encodeURIComponent(
      `Nuevo contacto desde ProntoTicketLive - ${form.name}`
    );

    const body = encodeURIComponent(
      `Nombre: ${form.name}\nEmail: ${form.email}\n\nMensaje:\n${form.message}`
    );

    window.location.href = `mailto:sales@prontoticketlive.com?subject=${subject}&body=${body}`;

    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* HERO */}
      <section className="border-b border-white/10 bg-gradient-to-b from-[#111827] via-[#0A0A0A] to-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Contáctanos
          </h1>

          <p className="mt-4 text-white/60 text-lg">
            ¿Tienes dudas, quieres vender eventos o necesitas soporte?
            Estamos aquí para ayudarte.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="rounded-3xl border border-white/10 bg-[#111111] p-8">

          {sent && (
            <div className="mb-6 flex items-center gap-2 text-green-300 bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
              <CheckCircle2 size={18} />
              Mensaje listo para enviar desde tu correo
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="text-sm text-white/60 mb-1 block">
                Nombre
              </label>
              <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/10 rounded-xl px-3">
                <User size={16} className="text-white/40" />
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-transparent py-3 outline-none text-white"
                  placeholder="Tu nombre"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-white/60 mb-1 block">
                Email
              </label>
              <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/10 rounded-xl px-3">
                <Mail size={16} className="text-white/40" />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-transparent py-3 outline-none text-white"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Mensaje */}
            <div>
              <label className="text-sm text-white/60 mb-1 block">
                Mensaje
              </label>
              <div className="flex gap-2 bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2">
                <MessageSquare size={16} className="text-white/40 mt-2" />
                <textarea
                  name="message"
                  required
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-transparent outline-none text-white resize-none"
                  placeholder="Escribe tu mensaje..."
                />
              </div>
            </div>

            {/* BOTÓN */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#007AFF] to-[#005BEA] py-3 rounded-xl font-semibold hover:brightness-110 transition"
            >
              <Send size={16} />
              Enviar mensaje
            </button>
          </form>
        </div>

        {/* EMAIL DIRECTO */}
        <div className="mt-6 text-center text-white/50 text-sm">
          También puedes escribirnos directamente a:
          <div className="text-white mt-1 font-semibold">
            sales@prontoticketlive.com
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}