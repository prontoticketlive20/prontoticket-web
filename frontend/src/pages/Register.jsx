import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";
import api from "../api/api";
import icono2026 from "../assets/icono_2026.png";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const captchaContainerRef = useRef(null);
  const widgetIdRef = useRef(null);

  const from = location.state?.from?.pathname || "/account";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const turnstileSiteKey =
    process.env.REACT_APP_TURNSTILE_SITE_KEY || "";

  // ============================================================
  // PASSWORD REQUIREMENTS
  // ============================================================

  const passwordChecks = {
    length: password.length >= 12,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };

  const passwordIsValid =
    passwordChecks.length &&
    passwordChecks.letter &&
    passwordChecks.number;

  // ============================================================
  // ERROR NORMALIZER
  // Convierte cualquier formato de error del backend en texto.
  // Evita mostrar "[object Object]".
  // ============================================================

  const extractErrorMessage = (error) => {
    const data = error?.response?.data;

    const normalizeMessage = (value) => {
      if (!value) return "";

      if (typeof value === "string") {
        return value;
      }

      if (Array.isArray(value)) {
        return value
          .map((item) => normalizeMessage(item))
          .filter(Boolean)
          .join(" ");
      }

      if (typeof value === "object") {
        if (value.message) {
          return normalizeMessage(value.message);
        }

        if (value.error) {
          return normalizeMessage(value.error);
        }

        if (value.details) {
          return normalizeMessage(value.details);
        }

        const objectMessages = Object.values(value)
          .map((item) => normalizeMessage(item))
          .filter(Boolean);

        if (objectMessages.length) {
          return objectMessages.join(" ");
        }
      }

      return "";
    };

    let message =
      normalizeMessage(data?.message) ||
      normalizeMessage(data?.error) ||
      normalizeMessage(data) ||
      normalizeMessage(error?.message);

    if (!message) {
      return "No se pudo completar el registro. Intenta nuevamente.";
    }

    const normalized = message.toLowerCase();

    if (
      normalized.includes("already exists") ||
      normalized.includes("email already exists") ||
      normalized.includes("unique constraint")
    ) {
      return "Ese email ya está registrado.";
    }

    if (
      normalized.includes("at least 12") ||
      normalized.includes("minimum length") ||
      normalized.includes("shorter than or equal to 12")
    ) {
      return "La contraseña debe contener al menos 12 caracteres.";
    }

    if (
      normalized.includes("at least one letter") ||
      normalized.includes("al menos una letra")
    ) {
      return "La contraseña debe contener al menos una letra.";
    }

    if (
      normalized.includes("at least one number") ||
      normalized.includes("al menos un número")
    ) {
      return "La contraseña debe contener al menos un número.";
    }

    if (
      normalized.includes("captcha") ||
      normalized.includes("turnstile")
    ) {
      return "No pudimos validar la verificación de seguridad. Complétala nuevamente.";
    }

    return message;
  };

  // ============================================================
  // TURNSTILE
  // ============================================================

  useEffect(() => {
    if (!turnstileSiteKey) return;

    const existingScript = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
    );

    const renderWidget = () => {
      if (!window.turnstile || !captchaContainerRef.current) {
        return;
      }

      if (widgetIdRef.current !== null) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(
        captchaContainerRef.current,
        {
          sitekey: turnstileSiteKey,
          theme: "dark",

          callback: (token) => {
            setTurnstileToken(token || "");
          },

          "expired-callback": () => {
            setTurnstileToken("");
          },

          "error-callback": () => {
            setTurnstileToken("");
          },
        }
      );
    };

    if (existingScript) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existingScript.addEventListener(
          "load",
          renderWidget,
          { once: true }
        );
      }

      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

    script.async = true;
    script.defer = true;
    script.onload = renderWidget;

    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [turnstileSiteKey]);

  const resetTurnstile = () => {
    if (
      window.turnstile &&
      widgetIdRef.current !== null
    ) {
      window.turnstile.reset(widgetIdRef.current);
    }

    setTurnstileToken("");
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setErrorMsg("");

    const trimmedName = name.trim();
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // ----------------------------------------------------------
    // FRONTEND VALIDATION
    // ----------------------------------------------------------

    if (!trimmedName) {
      setErrorMsg("Debes ingresar tu nombre.");
      return;
    }

    if (!normalizedEmail) {
      setErrorMsg("Debes ingresar tu email.");
      return;
    }

    if (!passwordChecks.length) {
      setErrorMsg(
        "La contraseña debe contener al menos 12 caracteres."
      );
      return;
    }

    if (!passwordChecks.letter) {
      setErrorMsg(
        "La contraseña debe contener al menos una letra."
      );
      return;
    }

    if (!passwordChecks.number) {
      setErrorMsg(
        "La contraseña debe contener al menos un número."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        "Las contraseñas no coinciden. Verifica e intenta nuevamente."
      );
      return;
    }

    if (!turnstileSiteKey) {
      setErrorMsg(
        "La verificación de seguridad no está disponible en este momento."
      );
      return;
    }

    if (!turnstileToken) {
      setErrorMsg(
        "Debes completar la verificación de seguridad antes de continuar."
      );
      return;
    }

    // ----------------------------------------------------------
    // REQUEST
    // ----------------------------------------------------------

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/register",
        {
          name: trimmedName,
          email: normalizedEmail,
          password,
          turnstileToken,
        }
      );

      const token =
        response.data?.access_token ||
        response.data?.token ||
        response.data?.data?.access_token ||
        response.data?.data?.token;

      const userData =
        response.data?.data ||
        response.data?.user ||
        response.data ||
        null;

      if (!token) {
        console.error(
          "Respuesta backend completa:",
          response.data
        );

        throw new Error(
          "No pudimos iniciar la sesión después del registro."
        );
      }

      localStorage.setItem(
        "ptl_token",
        token
      );

      localStorage.setItem(
        "ptl_user_name",
        userData?.name || trimmedName
      );

      localStorage.setItem(
        "ptl_user_role",
        userData?.role || "CUSTOMER"
      );

      navigate(from, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Error register:",
        error?.response?.data || error
      );

      const message =
        extractErrorMessage(error);

      setErrorMsg(message);

      // Turnstile genera tokens de un solo uso.
      // Si el registro falla, solicitamos una nueva validación.
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">

        <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-[#111111] to-[#0c0c0c] p-6 sm:p-8 shadow-2xl shadow-black/40">

          {/* HEADER */}

          <div className="text-center">

            <div className="mx-auto mb-5 w-20 h-20 rounded-[26px] bg-white/5 border border-white/10 flex items-center justify-center shadow-xl shadow-black/30">

              <img
                src={icono2026}
                alt="ProntoTicketLive"
                className="w-16 h-16 object-contain"
              />

            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/15 text-[#8ec5ff] text-xs font-semibold mb-4">

              <BadgeCheck size={14} />

              Registro seguro

            </div>

            <h2
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
              style={{
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Crear cuenta
            </h2>

            <p className="text-sm text-white/55 mt-2 leading-relaxed max-w-sm mx-auto">
              Regístrate para comprar, administrar y acceder
              fácilmente a tus entradas desde cualquier dispositivo.
            </p>

          </div>

          {/* ERROR MESSAGE */}

          {errorMsg ? (
            <div className="mt-5 rounded-2xl border border-red-500/25 bg-gradient-to-r from-red-500/10 to-red-500/[0.05] px-4 py-4">

              <div className="flex gap-3">

                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">

                  <AlertTriangle
                    size={17}
                    className="text-red-300"
                  />

                </div>

                <div>

                  <p className="text-sm font-semibold text-red-100">
                    No pudimos crear tu cuenta
                  </p>

                  <p className="text-sm text-red-200/80 mt-1 leading-relaxed">
                    {errorMsg}
                  </p>

                </div>

              </div>

            </div>
          ) : null}

          {/* FORM */}

          <form
            onSubmit={handleRegister}
            className="mt-6 space-y-4"
          >

            {/* NAME */}

            <div>

              <label className="text-xs text-white/65">
                Nombre
              </label>

              <div className="mt-1.5 relative">

                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) {
                      setErrorMsg("");
                    }
                  }}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40 focus:bg-white/[0.06] transition-all"
                  autoComplete="name"
                  required
                />

              </div>

            </div>

            {/* EMAIL */}

            <div>

              <label className="text-xs text-white/65">
                Email
              </label>

              <div className="mt-1.5 relative">

                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (errorMsg) {
                      setErrorMsg("");
                    }
                  }}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40 focus:bg-white/[0.06] transition-all"
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label className="text-xs text-white/65">
                Password
              </label>

              <div className="mt-1.5 relative">

                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  type="password"
                  placeholder="Crea una contraseña segura"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (errorMsg) {
                      setErrorMsg("");
                    }
                  }}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40 focus:bg-white/[0.06] transition-all"
                  autoComplete="new-password"
                  required
                />

              </div>

              {/* PASSWORD REQUIREMENTS */}

              <div className="mt-3 flex flex-wrap gap-2">

                <div
                  className={`px-2.5 py-1 rounded-full border text-[11px] transition-all ${
                    passwordChecks.length
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-white/[0.03] border-white/10 text-white/35"
                  }`}
                >
                  {passwordChecks.length ? "✓" : "•"} 12+ caracteres
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full border text-[11px] transition-all ${
                    passwordChecks.letter
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-white/[0.03] border-white/10 text-white/35"
                  }`}
                >
                  {passwordChecks.letter ? "✓" : "•"} Una letra
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full border text-[11px] transition-all ${
                    passwordChecks.number
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-white/[0.03] border-white/10 text-white/35"
                  }`}
                >
                  {passwordChecks.number ? "✓" : "•"} Un número
                </div>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div>

              <label className="text-xs text-white/65">
                Confirmar password
              </label>

              <div className="mt-1.5 relative">

                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value
                    );

                    if (errorMsg) {
                      setErrorMsg("");
                    }
                  }}
                  className={`w-full rounded-2xl bg-white/5 border pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:bg-white/[0.06] transition-all ${
                    confirmPassword &&
                    password !== confirmPassword
                      ? "border-red-500/30 focus:border-red-500/50"
                      : confirmPassword &&
                        password === confirmPassword &&
                        passwordIsValid
                      ? "border-emerald-500/25 focus:border-emerald-500/40"
                      : "border-white/10 focus:border-[#007AFF]/40"
                  }`}
                  autoComplete="new-password"
                  required
                />

              </div>

              {confirmPassword &&
              password !== confirmPassword ? (
                <p className="text-[11px] text-red-300/80 mt-2 ml-1">
                  Las contraseñas aún no coinciden.
                </p>
              ) : null}

              {confirmPassword &&
              password === confirmPassword &&
              passwordIsValid ? (
                <p className="text-[11px] text-emerald-300/80 mt-2 ml-1">
                  ✓ Las contraseñas coinciden.
                </p>
              ) : null}

            </div>

            {/* SECURITY */}

            <div>

              <label className="text-xs text-white/65 mb-2 block">
                Verificación de seguridad
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 flex justify-center">

                <div
                  ref={
                    captchaContainerRef
                  }
                />

              </div>

              <p className="text-[10px] leading-relaxed text-white/30 mt-2 px-1">
                Esta verificación protege tu cuenta y nuestra plataforma
                contra registros automatizados.
              </p>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold py-3.5 hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#007AFF]/20 transition-all"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  <span>
                    Creando cuenta...
                  </span>
                </>
              ) : (
                <span>
                  Crear cuenta
                </span>
              )}

            </button>

            {/* NAVIGATION */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">

              <button
                type="button"
                onClick={() =>
                  navigate("/")
                }
                className="w-full rounded-2xl border border-white/15 text-white/80 py-3 hover:bg-white/5 flex items-center justify-center gap-2 transition-all"
              >

                <ArrowLeft size={16} />

                <span>
                  Volver
                </span>

              </button>

              <Link
                to="/login"
                state={{
                  from:
                    location.state
                      ?.from || {
                      pathname: "/",
                    },
                }}
                className="w-full rounded-2xl bg-white/5 border border-white/10 text-white/90 py-3 hover:bg-white/10 text-center transition-all"
              >
                Login
              </Link>

            </div>

          </form>

        </div>

      </div>
    </div>
  );
}