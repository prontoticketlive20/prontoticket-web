import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  LogIn,
  LogOut,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Ticket,
  Calendar,
  MapPin,
  ChevronRight,
  History,
  User,
  Shield,
  CameraOff,
  Armchair,
  Tag,
  Clock,
  BarChart3,
  X,
} from 'lucide-react';

import api, { setAuthToken, getAuthToken } from '../api/api';
import { fetchEvents, fetchEventById } from '../services/events.service';

// Fallback local (si endpoints backend no existen todavía)
import {
  validateTicket as validateTicketLocal,
  getScanStats as getScanStatsLocal,
  getStoredTickets,
  parseQRCodeData,
  initializeDatabase,
} from '../services/ticketService';

import { STATUS_COLORS } from '../data/checkinData';

/**
 * Backend:
 * - POST /checkin/validate  body: { qrData, eventId, functionId }
 * - GET  /checkin/stats?eventId=...&functionId=...
 * - GET  /checkin/stats-by-type?eventId=...&functionId=...   (opcional functionId)
 *
 * Auth:
 * - POST /auth/login  -> access_token
 * - GET  /auth/me
 */

// ======================================================
// UI subcomponents
// ======================================================

const ResultDisplay = ({ scanResult, scanStatus }) => {
  const info = scanResult?.displayInfo || {};
  const resultStatus = scanResult?.status;

  return (
    <div className="p-4">
      <div className="flex items-center space-x-4 mb-3">
        <div className="flex-shrink-0">
          {scanStatus === 'success' && <CheckCircle2 size={48} className="text-white" />}
          {scanStatus === 'denied' && <XCircle size={48} className="text-white" />}
          {scanStatus === 'warning' && <AlertTriangle size={48} className="text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-xl">
            {info.status || scanResult?.message || 'Resultado'}
          </p>
          {resultStatus === 'used' && info.usedAt && (
            <p className="text-white/80 text-sm">Usado: {info.usedAt}</p>
          )}
        </div>
      </div>

      <div className="bg-black/20 rounded-xl p-3 space-y-2">
        <div className="flex items-center space-x-2">
          <Calendar size={14} className="text-white/60 flex-shrink-0" />
          <span className="text-white/60 text-sm">Evento:</span>
          <span className="text-white text-sm font-medium truncate">{info.event || '-'}</span>
        </div>

        {info.function && (
          <div className="flex items-center space-x-2">
            <Clock size={14} className="text-white/60 flex-shrink-0" />
            <span className="text-white/60 text-sm">Función:</span>
            <span className="text-white text-sm font-medium">{info.function}</span>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Tag size={14} className="text-white/60 flex-shrink-0" />
          <span className="text-white/60 text-sm">Tipo:</span>
          <span className="text-white text-sm font-medium">{info.ticketType || '-'}</span>
        </div>

        {info.seat && (
          <div className="flex items-center space-x-2">
            <Armchair size={14} className="text-white/60 flex-shrink-0" />
            <span className="text-white/60 text-sm">Asiento:</span>
            <span className="text-white text-sm font-medium">{info.seat}</span>
          </div>
        )}

        {info.holderName && (
          <div className="flex items-center space-x-2">
            <User size={14} className="text-white/60 flex-shrink-0" />
            <span className="text-white/60 text-sm">Titular:</span>
            <span className="text-white text-sm font-medium truncate">{info.holderName}</span>
          </div>
        )}

        <div className="pt-2 border-t border-white/10">
          <p className="text-white/40 text-xs font-mono truncate">
            ID: {info.ticketId || scanResult?.ticketId || '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

const ScanHistoryItem = ({ scan }) => {
  const info = scan.displayInfo || {};
  return (
    <div
      className={`p-3 rounded-xl border ${
        scan.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${scan.success ? 'text-green-400' : 'text-red-400'}`}>
            {scan.success ? '✓ Admitido' : `✗ ${scan.message}`}
          </p>

          {(info.ticketType || info.seat || info.holderName) && (
            <div className="mt-1 text-sm">
              {info.ticketType && <p className="text-white/70">{info.ticketType}</p>}
              {info.seat && <p className="text-white/60 text-xs">{info.seat}</p>}
              {info.holderName && <p className="text-white/50 text-xs">{info.holderName}</p>}
            </div>
          )}

          {scan.ticketId && <p className="text-white/40 text-xs font-mono mt-1 truncate">{scan.ticketId}</p>}
        </div>
        <p className="text-white/40 text-xs flex-shrink-0 ml-2">{scan.time}</p>
      </div>
    </div>
  );
};

const EventSelectButton = ({ event, onSelect }) => {
  const funcCount = event.functions ? event.functions.length : 0;

  return (
    <button
      onClick={() => onSelect(event)}
      className="w-full p-4 bg-[#121212] border border-white/10 rounded-xl text-left hover:border-[#007AFF]/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white font-semibold">{event.title}</h3>
          <div className="flex items-center flex-wrap gap-3 mt-2 text-white/60 text-sm">
            <span className="flex items-center">
              <Calendar size={12} className="mr-1" />
              {event.date || '-'}
            </span>
            <span className="flex items-center">
              <MapPin size={12} className="mr-1" />
              {event.venue || '-'}
            </span>
          </div>

          {event.isMultiFunction && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-[#FF9500]/20 text-[#FF9500] text-xs rounded-full">
              {funcCount} funciones
            </span>
          )}
        </div>
        <ChevronRight size={20} className="text-white/40" />
      </div>
    </button>
  );
};

const FunctionSelectButton = ({ func, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(func)}
      className="w-full p-4 bg-[#121212] border border-white/10 rounded-xl text-left hover:border-[#FF9500]/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FF9500]/20 flex items-center justify-center">
            <Clock size={20} className="text-[#FF9500]" />
          </div>
          <div>
            <p className="text-white font-semibold">{func.date || '-'}</p>
            <p className="text-[#FF9500] text-sm">{func.time || '--'} hrs</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-white/40" />
      </div>
    </button>
  );
};

// ======================================================
// Backend helpers
// ======================================================

async function validateTicketBackend({ qrData, eventId, functionId }) {
  const res = await api.post('/checkin/validate', { qrData, eventId, functionId });
  return res?.data ?? res;
}

async function getStatsBackend({ eventId, functionId }) {
  const res = await api.get('/checkin/stats', { params: { eventId, functionId } });
  return res?.data ?? res;
}

async function getStatsByTypeBackend({ eventId, functionId }) {
  const res = await api.get('/checkin/stats-by-type', { params: { eventId, functionId } });
  return res?.data ?? res;
}

async function loginBackend(email, password) {
  const res = await api.post('/auth/login', { email, password });
  const token =
    res?.data?.access_token ||
    res?.data?.token ||
    res?.data?.data?.access_token ||
    res?.data?.data?.token;

  return { token: token || null, raw: res?.data };
}

async function meBackend() {
  const res = await api.get('/auth/me');
  return res?.data ?? res;
}

// ======================================================
// Main
// ======================================================

const CheckInPage = () => {
  // Init local DB (fallback)
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffInfo, setStaffInfo] = useState(null);

  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Events
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

  // Selection
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFunction, setSelectedFunction] = useState(null);

  // Scanner + manual
  const [isScanning, setIsScanning] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Result + colors
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle');

  // History + modals
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [showTypeChart, setShowTypeChart] = useState(false);
  const [typeChartLoading, setTypeChartLoading] = useState(false);
  const [typeChartError, setTypeChartError] = useState('');
  const [typeChartData, setTypeChartData] = useState({ totalUsed: 0, items: [] });

  // Stats
  const [stats, setStats] = useState({ totalTickets: 0, usedTickets: 0, validTickets: 0 });

  // Fast mode to avoid double scans
  const [fastMode, setFastMode] = useState(true);
  const lastScanRef = useRef({ value: null, ts: 0 });

  const addToHistory = useCallback((entry) => {
    setScanHistory((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const closeAllOverlays = useCallback(() => {
    setShowHistory(false);
    setShowTypeChart(false);
  }, []);

  // ------------------------
  // Load session (token)
  // ------------------------
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    (async () => {
      try {
        const me = await meBackend();
        const data = me?.data ?? me;
        const role = data?.role;

        const allowed = ['ADMIN', 'SCANNER'];
        if (role && !allowed.includes(role)) {
          setAuthToken(null);
          setIsLoggedIn(false);
          setStaffInfo(null);
          setLoginError('Tu usuario no tiene permisos para CHECK-IN.');
          return;
        }

        setStaffInfo({
          name: data?.name || data?.email || 'Staff',
          role: role || 'SCANNER',
          email: data?.email,
        });
        setIsLoggedIn(true);
      } catch {
        setAuthToken(null);
        setIsLoggedIn(false);
        setStaffInfo(null);
      }
    })();
  }, []);

  // ------------------------
  // Load events after login
  // ------------------------
  useEffect(() => {
    if (!isLoggedIn) return;

    let mounted = true;

    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError('');
      try {
        const list = await fetchEvents();
        const detailed = [];

        for (const e of list) {
          try {
            const full = await fetchEventById(e.id);
            detailed.push({
              ...full,
              isMultiFunction: (full.functions?.length || 0) > 1,
              venue: full.venue || full.functions?.[0]?.venueName || '',
              date: full.date || full.functions?.[0]?.date || '',
            });
          } catch {
            detailed.push({
              ...e,
              isMultiFunction: (e.functions?.length || 0) > 1,
            });
          }
        }

        if (!mounted) return;
        setEvents(detailed);
      } catch {
        if (!mounted) return;
        setEventsError('No se pudieron cargar eventos desde el backend.');
        setEvents([]);
      } finally {
        if (mounted) setEventsLoading(false);
      }
    };

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  // ------------------------
  // Restore selection
  // ------------------------
  useEffect(() => {
    if (!isLoggedIn) return;

    const savedEvent = localStorage.getItem('checkin_event_selected');
    const savedFunction = localStorage.getItem('checkin_function_selected');

    if (savedEvent) {
      try {
        setSelectedEvent(JSON.parse(savedEvent));
      } catch {}
    }
    if (savedFunction) {
      try {
        setSelectedFunction(JSON.parse(savedFunction));
      } catch {}
    }
  }, [isLoggedIn]);

  // ------------------------
  // Poll stats
  // ------------------------
  useEffect(() => {
    if (!selectedEvent) return;

    let alive = true;

    const tick = async () => {
      const eventId = selectedEvent?.id;
      const functionId = selectedFunction?.id || null;

      try {
        const s = await getStatsBackend({ eventId, functionId });
        const payload = (s?.data ?? s)?.data ?? (s?.data ?? s);

        if (!alive) return;
        setStats({
          totalTickets: payload.totalTickets ?? 0,
          usedTickets: payload.usedTickets ?? 0,
          validTickets: payload.validTickets ?? 0,
        });
        return;
      } catch {
        const sLocal = getScanStatsLocal(eventId);
        if (!alive) return;
        setStats(sLocal);
      }
    };

    tick();
    const interval = setInterval(tick, 5000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [selectedEvent, selectedFunction]);

  const refreshStatsNow = useCallback(async () => {
    if (!selectedEvent) return;
    const eventId = selectedEvent?.id;
    const functionId = selectedFunction?.id || null;

    try {
      const s = await getStatsBackend({ eventId, functionId });
      const payload = (s?.data ?? s)?.data ?? (s?.data ?? s);

      setStats({
        totalTickets: payload.totalTickets ?? 0,
        usedTickets: payload.usedTickets ?? 0,
        validTickets: payload.validTickets ?? 0,
      });
    } catch {
      const sLocal = getScanStatsLocal(eventId);
      setStats(sLocal);
    }
  }, [selectedEvent, selectedFunction]);

  // ------------------------
  // Login / Logout
  // ------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const { token, raw } = await loginBackend(username, password);

      if (!token) {
        console.error('[CheckInPage] login response:', raw);
        setLoginError('Login fallido: el backend no devolvió token.');
        return;
      }

      setAuthToken(token);

      const me = await meBackend();
      const data = me?.data ?? me;
      const role = data?.role;

      const allowed = ['ADMIN', 'SCANNER'];
      if (role && !allowed.includes(role)) {
        setAuthToken(null);
        setIsLoggedIn(false);
        setStaffInfo(null);
        setLoginError('Tu usuario no tiene permisos para CHECK-IN.');
        return;
      }

      setStaffInfo({
        name: data?.name || data?.email || 'Staff',
        role: role || 'SCANNER',
        email: data?.email,
      });

      setIsLoggedIn(true);
    } catch {
      setLoginError('Usuario o contraseña incorrectos (o backend no responde).');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsLoggedIn(false);
    setStaffInfo(null);
    setSelectedEvent(null);
    setSelectedFunction(null);
    setIsScanning(false);
    setScanResult(null);
    setScanStatus('idle');
    setScanHistory([]);
    closeAllOverlays();

    localStorage.removeItem('checkin_event_selected');
    localStorage.removeItem('checkin_function_selected');
  };

  // ------------------------
  // Select event / function
  // ------------------------
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    localStorage.setItem('checkin_event_selected', JSON.stringify(event));

    if (!event.isMultiFunction && event.functions?.length === 1) {
      setSelectedFunction(event.functions[0]);
      localStorage.setItem('checkin_function_selected', JSON.stringify(event.functions[0]));
    } else {
      setSelectedFunction(null);
      localStorage.removeItem('checkin_function_selected');
    }

    setScanResult(null);
    setScanStatus('idle');
    setScanHistory([]);
    closeAllOverlays();
    setIsScanning(false);
  };

  const handleSelectFunction = (func) => {
    setSelectedFunction(func);
    localStorage.setItem('checkin_function_selected', JSON.stringify(func));
    setScanResult(null);
    setScanStatus('idle');
    setScanHistory([]);
    closeAllOverlays();
    setIsScanning(false);
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setSelectedFunction(null);
    setIsScanning(false);
    setScanResult(null);
    setScanStatus('idle');
    setScanHistory([]);
    closeAllOverlays();
    localStorage.removeItem('checkin_event_selected');
    localStorage.removeItem('checkin_function_selected');
  };

  // ------------------------
  // Chart by type
  // ------------------------
  const maxUsedInChart = useMemo(() => {
    const items = typeChartData?.items || [];
    return items.reduce((m, it) => Math.max(m, Number(it.used || 0)), 0) || 1;
  }, [typeChartData]);

  const openTypeChart = useCallback(async () => {
    if (!selectedEvent) return;

    setShowTypeChart(true);
    setTypeChartLoading(true);
    setTypeChartError('');

    try {
      const eventId = selectedEvent?.id;
      const functionId = selectedFunction?.id || null;

      const res = await getStatsByTypeBackend({ eventId, functionId });
      const payload = (res?.data ?? res)?.data ?? (res?.data ?? res);

      // soporta respuestas anidadas como en tu screenshot:
      // { success: true, data: { success:true, data:{ totalUsed, items } } }
      const deep = payload?.data?.data ? payload.data.data : payload?.data ? payload.data : payload;

      setTypeChartData({
        totalUsed: deep?.totalUsed ?? 0,
        items: deep?.items ?? [],
      });
    } catch (e) {
      console.error('stats-by-type error:', e);
      setTypeChartError('No se pudo cargar el gráfico por tipo (revisa endpoint y token).');
      setTypeChartData({ totalUsed: 0, items: [] });
    } finally {
      setTypeChartLoading(false);
    }
  }, [selectedEvent, selectedFunction]);

  // ------------------------
  // Unified validation (camera + manual)
  // ------------------------
  const processQrData = useCallback(
    async (qrDataRaw) => {
      const qrData = (qrDataRaw || '').trim();
      if (!qrData) return;

      // modo rápido: evita doble lectura (misma data en 1.5s)
      if (fastMode) {
        const now = Date.now();
        if (lastScanRef.current.value === qrData && now - lastScanRef.current.ts < 1500) return;
        lastScanRef.current = { value: qrData, ts: now };
      }

      if (navigator.vibrate) navigator.vibrate(60);

      const eventId = selectedEvent?.id;
      const functionId = selectedFunction?.id || null;

      // Backend-first
      try {
        const backendRes = await validateTicketBackend({ qrData, eventId, functionId });

        // IMPORTANT: evita el bug de data anidada (tu fix famoso)
        const validation = backendRes?.data || backendRes;
        setScanResult(validation.data || validation);

        const final = validation.data || validation;

        if (final.valid) {
          setScanStatus('success');
          if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

          addToHistory({
            success: true,
            message: 'Admitido',
            ticketId: final.ticketId,
            displayInfo: final.displayInfo,
            time: new Date().toLocaleTimeString(),
          });
        } else if (final.status === 'used') {
          setScanStatus('denied');
          if (navigator.vibrate) navigator.vibrate([200, 80, 200]);

          addToHistory({
            success: false,
            message: 'Ticket ya usado',
            ticketId: final.ticketId,
            displayInfo: final.displayInfo,
            time: new Date().toLocaleTimeString(),
          });
        } else {
          setScanStatus('warning');
          if (navigator.vibrate) navigator.vibrate(180);

          addToHistory({
            success: false,
            message: final.message || 'No válido',
            ticketId: final.ticketId,
            displayInfo: final.displayInfo,
            time: new Date().toLocaleTimeString(),
          });
        }

        // refresco inmediato de stats
        await refreshStatsNow();

        // auto-hide
        setTimeout(() => setScanStatus('idle'), 3500);
        return;
      } catch (e) {
        const status = e?.response?.status;

        // Auth: no fallback local (evita confusión)
        if (status === 401 || status === 403) {
          setScanResult({
            valid: false,
            status: 'denied',
            message: 'No autorizado. Vuelve a iniciar sesión.',
            errorCode: 'UNAUTHORIZED',
            displayInfo: null,
          });
          setScanStatus('denied');

          addToHistory({
            success: false,
            message: 'No autorizado',
            ticketId: null,
            time: new Date().toLocaleTimeString(),
          });

          setTimeout(() => setScanStatus('idle'), 3500);
          return;
        }

        // Fallback local
        const parsed = parseQRCodeData(qrData);
        if (!parsed) {
          setScanResult({
            valid: false,
            status: 'invalid',
            message: 'Código no reconocido. Pega el Ticket ID exacto o usa un QR válido.',
            errorCode: 'INVALID_FORMAT',
            displayInfo: null,
          });
          setScanStatus('warning');

          addToHistory({
            success: false,
            message: 'Formato no reconocido',
            ticketId: null,
            time: new Date().toLocaleTimeString(),
          });

          setTimeout(() => setScanStatus('idle'), 3500);
          return;
        }

        const validation = validateTicketLocal(qrData, {
          expectedEventId: eventId,
          expectedFunctionId: functionId,
        });

        setScanResult(validation);
        if (validation.valid) {
          setScanStatus('success');
          addToHistory({
            success: true,
            message: 'Admitido (local)',
            ticketId: validation.ticketId,
            displayInfo: validation.displayInfo,
            time: new Date().toLocaleTimeString(),
          });
        } else if (validation.status === 'used') {
          setScanStatus('denied');
          addToHistory({
            success: false,
            message: 'Ya utilizado (local)',
            ticketId: validation.ticketId,
            displayInfo: validation.displayInfo,
            time: new Date().toLocaleTimeString(),
          });
        } else {
          setScanStatus('warning');
          addToHistory({
            success: false,
            message: validation.message || 'No válido (local)',
            ticketId: validation.ticketId,
            displayInfo: validation.displayInfo,
            time: new Date().toLocaleTimeString(),
          });
        }

        setTimeout(() => setScanStatus('idle'), 3500);
      }
    },
    [addToHistory, fastMode, refreshStatsNow, selectedEvent, selectedFunction]
  );

  const handleScan = useCallback(
    async (detectedCodes) => {
      if (!detectedCodes || detectedCodes.length === 0) return;
      const qrData = detectedCodes[0].rawValue;
      if (!qrData) return;
      await processQrData(qrData);
    },
    [processQrData]
  );

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const v = manualValue.trim();
    if (!v) return;

    setIsManualSubmitting(true);
    try {
      await processQrData(v);
    } finally {
      setIsManualSubmitting(false);
    }
  };

  // ======================================================
  // Screens
  // ======================================================

  // LOGIN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-[#007AFF]">PRONTO</span>
              <span className="text-[#FF9500]">TICKET</span>
              <span className="text-white/80 text-lg ml-1">CHECK-IN</span>
            </h1>
            <p className="text-white/60 mt-2">Sistema de control de acceso</p>
          </div>

          <div className="bg-[#121212] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#007AFF]/20 flex items-center justify-center">
                <Shield size={20} className="text-[#007AFF]" />
              </div>
              <div>
                <h2 className="text-white font-bold">Acceso Staff</h2>
                <p className="text-white/50 text-sm">Ingresa tus credenciales</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-white/70 text-sm mb-1 block">Email</label>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#007AFF] focus:outline-none"
                  placeholder="scanner@correo.com"
                  required
                />
              </div>

              <div>
                <label className="text-white/70 text-sm mb-1 block">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#007AFF] focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold rounded-xl transition-all duration-300 hover:brightness-110 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-3 bg-[#1E1E1E] rounded-xl">
              <p className="text-white/50 text-xs text-center mb-2">Tip:</p>
              <p className="text-white/70 text-xs text-center">
                Usa un usuario real en tu tabla <span className="font-mono">User</span> con rol{' '}
                <span className="font-mono">ADMIN</span> o <span className="font-mono">SCANNER</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EVENT SELECT
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-[#007AFF]">CHECK</span>
              <span className="text-[#FF9500]">-IN</span>
            </h1>
            <p className="text-white/60 text-sm flex items-center">
              <User size={12} className="mr-1" />
              {staffInfo?.name} <span className="ml-2 text-white/40">({staffInfo?.role})</span>
            </p>
          </div>

          <button onClick={handleLogout} className="p-2 text-white/60 hover:text-white">
            <LogOut size={20} />
          </button>
        </div>

        <h2 className="text-white font-bold text-lg mb-4">Seleccionar Evento</h2>

        {eventsLoading && <p className="text-white/50">Cargando eventos...</p>}
        {eventsError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">
            {eventsError}
          </div>
        )}

        <div className="space-y-3">
          {events.map((event) => (
            <EventSelectButton key={event.id} event={event} onSelect={handleSelectEvent} />
          ))}
        </div>

        <div className="mt-6 p-4 bg-[#1E1E1E] rounded-xl">
          <p className="text-white/60 text-sm text-center">
            <Ticket size={14} className="inline mr-1" />
            {getStoredTickets().length} ticket(s) locales (fallback)
          </p>
        </div>
      </div>
    );
  }

  // FUNCTION SELECT
  if (selectedEvent.isMultiFunction && !selectedFunction) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={handleBackToEvents} className="text-[#007AFF] text-sm mb-1 hover:underline">
              ← Volver a eventos
            </button>
            <h1 className="text-lg font-bold text-white">{selectedEvent.title}</h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-white/60 hover:text-white">
            <LogOut size={20} />
          </button>
        </div>

        <h2 className="text-white font-bold text-lg mb-4">Seleccionar Función</h2>

        <div className="space-y-3">
          {(selectedEvent.functions || []).map((func) => (
            <FunctionSelectButton key={func.id} func={func} onSelect={handleSelectFunction} />
          ))}
        </div>
      </div>
    );
  }

  // MAIN SCANNER SCREEN
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Top */}
      <div className="p-4 bg-[#121212] border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {selectedEvent.title}
            </h1>

            <p className="text-white/60 text-xs flex items-center flex-wrap gap-2">
              <span className="flex items-center">
                <User size={10} className="mr-1" />
                {staffInfo?.name}
              </span>
              <span>•</span>
              <span>{selectedEvent.date || '-'}</span>
              {selectedFunction && selectedEvent.isMultiFunction && (
                <>
                  <span>•</span>
                  <span className="text-[#FF9500]">{selectedFunction.time}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={openTypeChart}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
              title="Gráfico por tipo"
            >
              <BarChart3 size={18} />
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
              title="Historial"
            >
              <History size={18} />
            </button>

            <button
              onClick={handleBackToEvents}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
              title="Cambiar evento"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-3 p-3 bg-[#1E1E1E] rounded-xl">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-white">{stats.totalTickets}</p>
            <p className="text-white/50 text-xs">Total</p>
          </div>
          <div className="text-center flex-1 border-x border-white/10">
            <p className="text-2xl font-bold text-green-500">{stats.usedTickets}</p>
            <p className="text-white/50 text-xs">Admitidos</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-blue-400">{stats.validTickets}</p>
            <p className="text-white/50 text-xs">Pendientes</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 gap-2">
          <button
            onClick={refreshStatsNow}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 flex items-center gap-2"
            title="Actualizar stats"
          >
            <RefreshCw size={16} />
            <span className="text-sm">Actualizar stats</span>
          </button>

          <button
            onClick={() => setFastMode((v) => !v)}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
              fastMode
                ? 'bg-green-500/15 border-green-500/30 text-green-300'
                : 'bg-white/5 border-white/10 text-white/70'
            }`}
            title="Modo rápido"
          >
            Modo rápido: {fastMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Manual input */}
        <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
          <input
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder="Pega aquí Ticket ID / QR Data"
            className="flex-1 px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#007AFF] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isManualSubmitting}
            className="px-4 py-2 rounded-xl bg-[#007AFF] text-white font-semibold disabled:opacity-50"
          >
            {isManualSubmitting ? '...' : 'Validar'}
          </button>
        </form>
        <p className="text-white/40 text-xs mt-1">
          Tip: pega el UUID del ticket (ticketId) tal cual, o el qrData completo. El backend decide.
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 relative min-h-[300px]">
        {isScanning ? (
          <div className="absolute inset-0">
            <Scanner
              onScan={handleScan}
              onError={(error) => console.error('Scanner error:', error)}
              constraints={{ facingMode: 'environment' }}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { width: '100%', height: '100%', objectFit: 'cover' },
              }}
              components={{ audio: false, torch: true }}
            />

            {/* Overlay retícula */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-[#007AFF] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-[#007AFF] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-[#007AFF] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-[#007AFF] rounded-br-lg" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-transparent via-[#007AFF] to-transparent animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <button
              onClick={() => {
                closeAllOverlays();
                setIsScanning(true);
              }}
              className="p-8 bg-gradient-to-br from-[#007AFF] to-[#0056b3] rounded-full shadow-lg shadow-[#007AFF]/30 hover:shadow-[#007AFF]/50 transition-shadow"
            >
              <Camera size={48} className="text-white" />
            </button>
            <p className="text-white/60 text-sm">Toca para activar la cámara</p>
          </div>
        )}
      </div>

      {/* Result bar */}
      <div className={`transition-all duration-300 ${STATUS_COLORS[scanStatus] || STATUS_COLORS.idle}`}>
        {scanResult && scanResult.displayInfo ? (
          <ResultDisplay scanResult={scanResult} scanStatus={scanStatus} />
        ) : scanResult ? (
          <div className="p-4 flex items-center space-x-4">
            <div className="flex-shrink-0">
              {scanStatus === 'warning' && <AlertTriangle size={48} className="text-white" />}
              {scanStatus === 'denied' && <XCircle size={48} className="text-white" />}
              {scanStatus === 'success' && <CheckCircle2 size={48} className="text-white" />}
              {scanStatus === 'idle' && <Ticket size={48} className="text-white/50" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg">{scanResult.message || 'Resultado'}</p>
              {scanResult.ticketId && (
                <p className="text-white/60 text-xs font-mono truncate">{scanResult.ticketId}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 flex items-center space-x-4">
            <Ticket size={48} className="text-white/50" />
            <div>
              <p className="text-white/80 font-semibold">Listo para escanear</p>
              <p className="text-white/50 text-sm">Apunta la cámara al código QR del ticket</p>
            </div>
          </div>
        )}
      </div>

      {/* Stop scanner */}
      {isScanning && (
        <div className="p-4 bg-[#121212] border-t border-white/10">
          <button
            onClick={() => setIsScanning(false)}
            className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl flex items-center justify-center space-x-2"
          >
            <CameraOff size={18} />
            <span>Detener Escáner</span>
          </button>
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 bg-[#121212] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-bold">Historial de escaneos</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {scanHistory.length === 0 ? (
                <p className="text-white/50 text-center py-6">No hay escaneos</p>
              ) : (
                <div className="space-y-2">
                  {scanHistory.map((scan, index) => (
                    <ScanHistoryItem key={index} scan={scan} />
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-[#121212] border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowHistory(false);
                  setIsScanning(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#007AFF] text-white font-semibold"
              >
                Volver al scanner
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chart modal */}
      {showTypeChart && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 bg-[#121212] border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Ingresos por tipo de entrada</h3>
                <p className="text-white/50 text-xs">Evento: {selectedEvent?.title}</p>
              </div>
              <button
                onClick={() => setShowTypeChart(false)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {typeChartLoading ? (
                <p className="text-white/60">Cargando...</p>
              ) : typeChartError ? (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {typeChartError}
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white/70 text-sm">
                      Total admitidos (suma):{' '}
                      <span className="text-white font-bold">{typeChartData.totalUsed}</span>
                    </p>
                  </div>

                  {(!typeChartData.items || typeChartData.items.length === 0) ? (
                    <p className="text-white/50 text-center py-6">No hay datos por tipo todavía.</p>
                  ) : (
                    <div className="space-y-3">
                      {typeChartData.items.map((it, idx) => {
                        const used = Number(it.used || 0);
                        const pct = Math.round((used / maxUsedInChart) * 100);
                        return (
                          <div key={idx} className="p-3 rounded-xl border border-white/10 bg-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-white font-semibold">{it.ticketType}</p>
                              <p className="text-white/70 text-sm">
                                {used} <span className="text-white/40">admitidos</span>
                              </p>
                            </div>
                            <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden">
                              <div className="h-full bg-[#007AFF]" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 bg-[#121212] border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={openTypeChart}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Actualizar
              </button>
              <button
                onClick={() => setShowTypeChart(false)}
                className="px-4 py-2 rounded-xl bg-[#007AFF] text-white font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;