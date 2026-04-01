import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import logoProntoTicketLive from "../assets/logo-prontoticketlive.png";

const Footer = () => {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <img
              src={logoProntoTicketLive}
              alt="ProntoTicketLive"
              className="h-14 w-auto"
            />
            <p className="text-white/60 text-sm leading-relaxed">
              Tu plataforma de confianza para comprar tickets de los mejores eventos en vivo.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-white/60 hover:text-[#007AFF] transition-colors duration-200"
                data-testid="footer-facebook-link"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-[#007AFF] transition-colors duration-200"
                data-testid="footer-twitter-link"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-[#FF9500] transition-colors duration-200"
                data-testid="footer-instagram-link"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-[#007AFF] transition-colors duration-200"
                data-testid="footer-youtube-link"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3
              className="text-white font-semibold mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/#eventos"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                  data-testid="footer-link-events"
                >
                  Eventos
                </a>
              </li>
              <li>
                <Link
                  to="/nosotros"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                  data-testid="footer-link-about"
                >
                  Nosotros
                </Link>
              </li>
              <li>
                <Link
                  to="/contacto"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                  data-testid="footer-link-contact"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3
              className="text-white font-semibold mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Políticas
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terminos"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                  data-testid="footer-link-terms"
                >
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link
                  to="/contacto"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                  data-testid="footer-link-support"
                >
                  Soporte y Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3
              className="text-white font-semibold mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <Mail className="text-[#007AFF] flex-shrink-0 mt-0.5" size={16} />
                <a
                  href="mailto:sales@prontoticketlive.com"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                >
                  sales@prontoticketlive.com
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <Phone className="text-[#FF9500] flex-shrink-0 mt-0.5" size={16} />
                <a
                  href="tel:+14073604497"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                >
                  +1 407 360 4497
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="text-[#007AFF] flex-shrink-0 mt-0.5" size={16} />
                <span className="text-white/60 text-sm">Orlando FL, USA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            © 2026 ProntoTicket Group LLC. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;