import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Eventos', href: '#eventos' },
    { name: 'Sedes', href: '#sedes' },
    { name: 'Nosotros', href: '#nosotros' },
    { name: 'Contacto', href: '#contacto' }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/60 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a 
            href="/" 
            className="flex items-center space-x-2 transition-opacity duration-300 hover:opacity-80"
            data-testid="header-logo-link"
          >
            <img 
              src="https://customer-assets.emergentagent.com/job_df4a73ed-0c0c-4268-9eaf-d95c4450d1cd/artifacts/bgf87i71_PRONTOlive.png"
              alt="ProntoTicketLive"
              className="h-12 w-auto"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-white/80 hover:text-white transition-colors duration-200 font-medium"
                data-testid={`nav-link-${link.name.toLowerCase()}`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              className="px-6 py-2.5 text-white font-semibold hover:bg-white/10 rounded-full transition-all duration-300 border border-white/20 hover:border-white/40"
              data-testid="sign-in-button"
            >
              Iniciar Sesión
            </button>
            <button
              className="px-6 py-2.5 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold rounded-full transition-all duration-300 hover:brightness-110 shadow-[0_0_20px_rgba(0,122,255,0.4)] hover:shadow-[0_0_30px_rgba(0,122,255,0.6)] active:scale-95"
              data-testid="get-tickets-button"
            >
              Comprar Tickets
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white"
            data-testid="mobile-menu-button"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 bg-black/80 backdrop-blur-xl border-t border-white/10">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-white/80 hover:text-white transition-colors duration-200 font-medium px-4 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-nav-link-${link.name.toLowerCase()}`}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col space-y-2 px-4 pt-4">
                <button
                  className="px-6 py-2.5 text-white font-semibold hover:bg-white/10 rounded-full transition-all duration-300 border border-white/20"
                  data-testid="mobile-sign-in-button"
                >
                  Iniciar Sesión
                </button>
                <button
                  className="px-6 py-2.5 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold rounded-full transition-all duration-300 hover:brightness-110"
                  data-testid="mobile-get-tickets-button"
                >
                  Comprar Tickets
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
