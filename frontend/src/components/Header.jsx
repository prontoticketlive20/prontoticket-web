import React, { useState, useEffect } from 'react';
import { Menu, X, Globe } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'es';
    setLanguage(savedLanguage);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
    // Aquí se implementaría el cambio de idioma global
  };

  const navLinks = [
    { name: 'Eventos', href: '#eventos' },
    { name: 'Sedes', href: '#sedes' },
    { name: 'Nosotros', href: '#nosotros' },
    { name: 'Contacto', href: '#contacto' }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black shadow-lg shadow-black/50' : 'bg-black/95'
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
                className="text-white/70 hover:text-white transition-colors duration-200 font-medium text-sm tracking-wide"
                data-testid={`nav-link-${link.name.toLowerCase()}`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Actions + Language Selector */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative group">
              <button
                className="flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                data-testid="language-selector-button"
              >
                <Globe size={16} strokeWidth={2} />
                <span className="text-sm font-medium">{language === 'es' ? 'ES' : 'EN'}</span>
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-32 bg-[#121212] rounded-xl border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={() => handleLanguageChange('es')}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 rounded-t-xl ${
                    language === 'es' 
                      ? 'text-[#007AFF] bg-[#007AFF]/10 font-semibold' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  data-testid="language-option-es"
                >
                  Español
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 rounded-b-xl ${
                    language === 'en' 
                      ? 'text-[#007AFF] bg-[#007AFF]/10 font-semibold' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  data-testid="language-option-en"
                >
                  English
                </button>
              </div>
            </div>

            <div className="w-px h-6 bg-white/10" />

            <button
              className="px-5 py-2.5 text-white/80 font-semibold hover:text-white rounded-full transition-all duration-300 text-sm tracking-wide"
              data-testid="sign-in-button"
            >
              Iniciar Sesión
            </button>
            <button
              className="px-6 py-2.5 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg shadow-[#FF9500]/30 hover:shadow-[#FF9500]/50 active:scale-95 text-sm tracking-wide"
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
          <div className="md:hidden py-4 bg-black/95 border-t border-white/10">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-white/70 hover:text-white transition-colors duration-200 font-medium px-4 py-2 text-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-nav-link-${link.name.toLowerCase()}`}
                >
                  {link.name}
                </a>
              ))}
              
              {/* Mobile Language Selector */}
              <div className="px-4 pt-2 pb-4 border-t border-white/10">
                <div className="flex items-center space-x-2 mb-3">
                  <Globe size={16} className="text-white/60" strokeWidth={2} />
                  <span className="text-white/60 text-sm font-medium">Idioma</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLanguageChange('es')}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      language === 'es'
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                    data-testid="mobile-language-es"
                  >
                    Español
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      language === 'en'
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                    data-testid="mobile-language-en"
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-2 px-4 pt-4">
                <button
                  className="px-6 py-2.5 text-white font-semibold hover:bg-white/10 rounded-full transition-all duration-300 border border-white/20 text-sm"
                  data-testid="mobile-sign-in-button"
                >
                  Iniciar Sesión
                </button>
                <button
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg text-sm"
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
