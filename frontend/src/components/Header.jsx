import React, { useEffect, useCallback, useState } from "react";
import { Menu, X, Globe, LayoutDashboard, LogOut, User2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import logoProntoTicketLive from "../assets/logo-prontoticketlive.png";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState("es");

  const [isAuthed, setIsAuthed] = useState(false);
  const [userLabel, setUserLabel] = useState("Guest");
  const [userRole, setUserRole] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const getToken = useCallback(() => {
    return (
      localStorage.getItem("ptl_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      ""
    );
  }, []);

  const clearAuthStorage = useCallback(() => {
    localStorage.removeItem("ptl_token");
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("ptl_user_name");
    localStorage.removeItem("ptl_user_role");
  }, []);

  // ✅ Ruta por rol
  const getDashboardPath = useCallback((role) => {
    if (role === "ADMIN") return "/admin";
    if (role === "SCANNER") return "/checkin";
    if (role === "PRODUCER") return "/admin";
    if (role === "CUSTOMER") return "/account";
    return "/dashboard";
  }, []);

  const getDashboardLabel = useCallback((role) => {
    if (role === "CUSTOMER") return "Mi Cuenta";
    return "Dashboard";
  }, []);

  const refreshAuthState = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setIsAuthed(false);
      setUserRole(null);
      setUserLabel("Guest");
      return;
    }

    setIsAuthed(true);

    const savedName = localStorage.getItem("ptl_user_name") || "";
    const savedRole = localStorage.getItem("ptl_user_role") || null;
    setUserLabel(savedName || "Cuenta");
    setUserRole(savedRole);

    try {
      const res = await api.get("/auth/me");
      const me = res.data?.data ?? res.data;

      const role = me?.role || savedRole || null;
      const label = me?.name || me?.email || savedName || "Cuenta";

      setIsAuthed(true);
      setUserRole(role);
      setUserLabel(label);

      localStorage.setItem("ptl_user_name", label);
      if (role) localStorage.setItem("ptl_user_role", role);
    } catch (e) {
      clearAuthStorage();
      setIsAuthed(false);
      setUserRole(null);
      setUserLabel("Guest");
    }
  }, [getToken, clearAuthStorage]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    const savedLanguage = localStorage.getItem("preferredLanguage") || "es";
    setLanguage(savedLanguage);

    refreshAuthState();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [refreshAuthState]);

  useEffect(() => {
    refreshAuthState();
    setIsMobileMenuOpen(false);
  }, [location.pathname, refreshAuthState]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
  };

  const handleLogout = () => {
    clearAuthStorage();
    setIsAuthed(false);
    setUserRole(null);
    setUserLabel("Guest");
    navigate("/");
  };

  const navLinks = [
    { name: "Eventos", href: "#eventos" },
    { name: "Sedes", href: "#sedes" },
    { name: "Nosotros", href: "#nosotros" },
    { name: "Contacto", href: "#contacto" },
  ];

  const dashboardPath = isAuthed ? getDashboardPath(userRole) : "/login";
  const dashboardLabel = getDashboardLabel(userRole);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black shadow-lg shadow-black/50" : "bg-black/95"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            to="/"
            className="flex items-center space-x-2 transition-opacity duration-300 hover:opacity-80"
            data-testid="header-logo-link"
          >
            <img
              src={logoProntoTicketLive}
              alt="ProntoTicketLive"
              className="h-14 w-auto"
            />
          </Link>

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

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative group">
              <button
                className="flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                data-testid="language-selector-button"
                type="button"
              >
                <Globe size={16} strokeWidth={2} />
                <span className="text-sm font-medium">
                  {language === "es" ? "ES" : "EN"}
                </span>
              </button>

              <div className="absolute right-0 top-full mt-2 w-32 bg-[#121212] rounded-xl border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={() => handleLanguageChange("es")}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 rounded-t-xl ${
                    language === "es"
                      ? "text-[#007AFF] bg-[#007AFF]/10 font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                  type="button"
                >
                  Español
                </button>
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 rounded-b-xl ${
                    language === "en"
                      ? "text-[#007AFF] bg-[#007AFF]/10 font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                  type="button"
                >
                  English
                </button>
              </div>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {!isAuthed ? (
              <div className="flex items-center space-x-3">
                <span className="text-white/50 text-sm">Guest</span>

                <Link
                  to="/login"
                  state={{ from: location }}
                  className="px-5 py-2.5 text-white/80 font-semibold hover:text-white rounded-full transition-all duration-300 text-sm tracking-wide hover:bg-white/5"
                  data-testid="sign-in-link"
                >
                  Iniciar sesión
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
                  <User2 size={16} className="text-white/70" />
                  <span className="text-white/80 text-sm font-semibold truncate max-w-[180px]">
                    {userLabel}
                  </span>
                  {userRole ? (
                    <span className="text-white/40 text-xs ml-1">({userRole})</span>
                  ) : null}
                </div>

                <Link
                  to={dashboardPath}
                  className="px-4 py-2.5 bg-white/5 text-white/80 font-semibold rounded-full transition-all duration-300 hover:bg-white/10 text-sm flex items-center space-x-2"
                  data-testid="dashboard-link"
                >
                  <LayoutDashboard size={16} />
                  <span>{dashboardLabel}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-red-500/15 border border-red-500/25 text-red-300 font-semibold rounded-full transition-all duration-300 hover:bg-red-500/25 text-sm flex items-center space-x-2"
                  data-testid="logout-button"
                  type="button"
                >
                  <LogOut size={16} />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white"
            data-testid="mobile-menu-button"
            type="button"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

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

              <div className="px-4 pt-2 pb-4 border-t border-white/10">
                <div className="flex items-center space-x-2 mb-3">
                  <Globe size={16} className="text-white/60" strokeWidth={2} />
                  <span className="text-white/60 text-sm font-medium">Idioma</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLanguageChange("es")}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      language === "es"
                        ? "bg-[#007AFF] text-white"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                    type="button"
                  >
                    Español
                  </button>
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      language === "en"
                        ? "bg-[#007AFF] text-white"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                    type="button"
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-white/10">
                {!isAuthed ? (
                  <>
                    <div className="text-white/50 text-sm px-2">Guest</div>
                    <Link
                      to="/login"
                      state={{ from: location }}
                      className="px-6 py-2.5 text-white font-semibold hover:bg-white/10 rounded-full transition-all duration-300 border border-white/20 text-sm text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid="mobile-sign-in-link"
                    >
                      Iniciar Sesión
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="px-2 text-white/80 text-sm">
                      {userLabel}{" "}
                      {userRole ? <span className="text-white/40">({userRole})</span> : null}
                    </div>

                    <Link
                      to={dashboardPath}
                      className="px-6 py-2.5 bg-white/5 text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/10 text-sm text-center flex items-center justify-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid="mobile-dashboard-link"
                    >
                      <LayoutDashboard size={16} />
                      <span>{dashboardLabel}</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="px-6 py-2.5 bg-red-500/15 border border-red-500/25 text-red-300 font-semibold rounded-full transition-all duration-300 hover:bg-red-500/25 text-sm flex items-center justify-center space-x-2"
                      type="button"
                      data-testid="mobile-logout-button"
                    >
                      <LogOut size={16} />
                      <span>Salir</span>
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;