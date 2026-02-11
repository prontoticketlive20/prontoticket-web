import React, { useState, useEffect, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  LogIn, LogOut, Camera, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Users, Ticket, Calendar, MapPin, ChevronRight,
  History, BarChart3, User, Shield, CameraOff
} from 'lucide-react';
import { 
  validateTicket, 
  getScanStats, 
  getStoredTickets,
  parseQRCodeData
} from '../services/ticketService';

/**
 * Check-In Page for Staff
 * 
 * Validates tickets by scanning QR codes in JSON format:
 * { ticketId: "TCK-xxx", orderId: "ORD-xxx", eventId: "EVT-xxx" }
 * 
 * Features:
 * - Staff login (mock)
 * - Event selection
 * - Camera-based QR scanning
 * - Real-time validation
 * - Visual status indicators (green/red/yellow)
 * - Scan logging
 */

// Status colors
const STATUS_COLORS = {
  success: 'bg-green-500',
  denied: 'bg-red-500',
  warning: 'bg-yellow-500',
  idle: 'bg-gray-700'
};

// Mock staff accounts
const MOCK_STAFF = [
  { username: 'admin', password: 'admin123', name: 'Administrador', role: 'admin' },
  { username: 'scanner1', password: 'scan123', name: 'Scanner 1', role: 'scanner' },
  { username: 'scanner2', password: 'scan123', name: 'Scanner 2', role: 'scanner' }
];

// Mock events (matching frontend mock data)
const MOCK_EVENTS = [
  {
    id: 'EVT-1',
    title: 'Festival Músical Verano 2025',
    date: '15 JUN 2025',
    time: '18:00',
    venue: 'Estadio Nacional',
    city: 'Ciudad de México'
  },
  {
    id: 'EVT-2',
    title: 'Teatro: Noche de Gala',
    date: '20 JUN 2025',
    time: '20:00',
    venue: 'Teatro Nacional',
    city: 'Ciudad de México'
  },
  {
    id: 'EVT-3',
    title: 'Concierto Internacional',
    date: '25 JUN 2025',
    time: '19:00',
    venue: 'Arena México',
    city: 'Ciudad de México'
  }
];

const CheckInPage = () => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffInfo, setStaffInfo] = useState(null);
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Event selection
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle');
  const [lastScannedQR, setLastScannedQR] = useState(null);
  
  // Stats and history
  const [stats, setStats] = useState({ totalTickets: 0, usedTickets: 0, validTickets: 0 });
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load saved session
  useEffect(() => {
    const savedStaff = localStorage.getItem('checkin_staff_mock');
    const savedEvent = localStorage.getItem('checkin_event_mock');
    
    if (savedStaff) {
      setStaffInfo(JSON.parse(savedStaff));
      setIsLoggedIn(true);
      
      if (savedEvent) {
        setSelectedEvent(JSON.parse(savedEvent));
      }
    }
  }, []);

  // Update stats periodically
  useEffect(() => {
    if (selectedEvent) {
      updateStats();
      const interval = setInterval(updateStats, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedEvent]);

  const updateStats = () => {
    const currentStats = getScanStats();
    setStats(currentStats);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    // Simulate login delay
    setTimeout(() => {
      const staff = MOCK_STAFF.find(s => s.username === username && s.password === password);
      
      if (staff) {
        const staffData = { name: staff.name, role: staff.role, username: staff.username };
        setStaffInfo(staffData);
        setIsLoggedIn(true);
        localStorage.setItem('checkin_staff_mock', JSON.stringify(staffData));
      } else {
        setLoginError('Usuario o contraseña incorrectos');
      }
      
      setIsLoggingIn(false);
    }, 500);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStaffInfo(null);
    setSelectedEvent(null);
    setIsScanning(false);
    setScanResult(null);
    localStorage.removeItem('checkin_staff_mock');
    localStorage.removeItem('checkin_event_mock');
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    localStorage.setItem('checkin_event_mock', JSON.stringify(event));
    updateStats();
  };

  const handleScan = useCallback((detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    
    const qrData = detectedCodes[0].rawValue;
    if (!qrData) return;
    
    // Prevent rapid re-scanning of same QR
    if (lastScannedQR === qrData && scanResult && Date.now() - (scanResult.timestamp || 0) < 3000) {
      return;
    }
    
    setLastScannedQR(qrData);
    
    // Vibrate on scan (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    // Parse and validate QR
    const parsed = parseQRCodeData(qrData);
    
    if (!parsed) {
      // Invalid QR format
      setScanResult({
        valid: false,
        status: 'invalid',
        message: 'Código QR inválido - formato no reconocido',
        errorCode: 'INVALID_FORMAT',
        timestamp: Date.now()
      });
      setScanStatus('warning');
      
      if (navigator.vibrate) navigator.vibrate(300);
      
      // Add to history
      addToHistory({
        success: false,
        message: 'QR Inválido',
        ticketId: null,
        time: new Date().toLocaleTimeString()
      });
      
      setTimeout(() => setScanStatus('idle'), 3000);
      return;
    }
    
    // Check event ID matches
    if (selectedEvent && parsed.eventId !== selectedEvent.id) {
      setScanResult({
        valid: false,
        status: 'invalid',
        message: 'Este ticket no es para este evento',
        errorCode: 'WRONG_EVENT',
        ticketId: parsed.ticketId,
        timestamp: Date.now()
      });
      setScanStatus('warning');
      
      if (navigator.vibrate) navigator.vibrate(300);
      
      addToHistory({
        success: false,
        message: 'Evento incorrecto',
        ticketId: parsed.ticketId,
        time: new Date().toLocaleTimeString()
      });
      
      setTimeout(() => setScanStatus('idle'), 3000);
      return;
    }
    
    // Validate ticket
    const validation = validateTicket(qrData, selectedEvent?.id);
    
    setScanResult({
      ...validation,
      timestamp: Date.now()
    });
    
    if (validation.valid) {
      setScanStatus('success');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      
      addToHistory({
        success: true,
        message: 'Admitido',
        ticketId: validation.ticketId,
        ticketType: validation.ticket?.ticketType,
        holderName: validation.ticket?.holderName,
        time: new Date().toLocaleTimeString()
      });
    } else if (validation.status === 'used') {
      setScanStatus('denied');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      
      addToHistory({
        success: false,
        message: 'Ya utilizado',
        ticketId: validation.ticketId,
        time: new Date().toLocaleTimeString()
      });
    } else {
      setScanStatus('warning');
      if (navigator.vibrate) navigator.vibrate(300);
      
      addToHistory({
        success: false,
        message: validation.message,
        ticketId: validation.ticketId,
        time: new Date().toLocaleTimeString()
      });
    }
    
    // Update stats
    updateStats();
    
    // Reset status after delay
    setTimeout(() => {
      setScanStatus('idle');
    }, 3000);
    
  }, [selectedEvent, lastScannedQR, scanResult]);

  const addToHistory = (entry) => {
    setScanHistory(prev => [entry, ...prev].slice(0, 50));
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-[#007AFF]">PRONTO</span>
              <span className="text-[#FF9500]">TICKET</span>
              <span className="text-white/80 text-lg ml-1">CHECK-IN</span>
            </h1>
            <p className="text-white/60 mt-2">Sistema de control de acceso</p>
          </div>
          
          {/* Login Form */}
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
                <label className="text-white/70 text-sm mb-1 block">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#007AFF] focus:outline-none"
                  placeholder="Nombre de usuario"
                  required
                  data-testid="login-username"
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
                  data-testid="login-password"
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
                data-testid="login-button"
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
            
            {/* Demo credentials */}
            <div className="mt-6 p-3 bg-[#1E1E1E] rounded-xl">
              <p className="text-white/50 text-xs text-center mb-2">Credenciales de prueba:</p>
              <p className="text-white/70 text-xs text-center font-mono">
                scanner1 / scan123
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Event Selection Screen
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-[#007AFF]">CHECK</span>
              <span className="text-[#FF9500]">-IN</span>
            </h1>
            <p className="text-white/60 text-sm flex items-center">
              <User size={12} className="mr-1" />
              {staffInfo?.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-white/60 hover:text-white"
          >
            <LogOut size={20} />
          </button>
        </div>
        
        {/* Event Selection */}
        <div className="mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Seleccionar Evento</h2>
          
          <div className="space-y-3">
            {MOCK_EVENTS.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className="w-full p-4 bg-[#121212] border border-white/10 rounded-xl text-left hover:border-[#007AFF]/50 transition-colors"
                data-testid={`event-${event.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{event.title}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-white/60 text-sm">
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {event.date}
                      </span>
                      <span className="flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {event.venue}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/40" />
                </div>
              </button>
            ))}
          </div>
          
          {/* Info about tickets */}
          <div className="mt-6 p-4 bg-[#1E1E1E] rounded-xl">
            <p className="text-white/60 text-sm text-center">
              <Ticket size={14} className="inline mr-1" />
              {getStoredTickets().length} ticket(s) en el sistema
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Scanner Screen
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <div className="p-4 bg-[#121212] border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {selectedEvent.title}
            </h1>
            <p className="text-white/60 text-xs flex items-center">
              <User size={10} className="mr-1" />
              {staffInfo?.name} • {selectedEvent.date}
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-[#007AFF] text-white' : 'text-white/60 hover:text-white'}`}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => {
                setSelectedEvent(null);
                localStorage.removeItem('checkin_event_mock');
              }}
              className="p-2 text-white/60 hover:text-white"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        
        {/* Stats Bar */}
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
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="absolute inset-0 top-[160px] bg-[#0A0A0A] z-20 overflow-y-auto p-4">
          <h3 className="text-white font-bold mb-4">Escaneos Recientes</h3>
          {scanHistory.length === 0 ? (
            <p className="text-white/50 text-center py-4">No hay escaneos</p>
          ) : (
            <div className="space-y-2">
              {scanHistory.map((scan, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-xl border ${scan.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${scan.success ? 'text-green-400' : 'text-red-400'}`}>
                        {scan.success ? '✓ Admitido' : '✗ ' + scan.message}
                      </p>
                      {scan.holderName && (
                        <p className="text-white/70 text-sm">{scan.holderName}</p>
                      )}
                      {scan.ticketId && (
                        <p className="text-white/50 text-xs font-mono">{scan.ticketId}</p>
                      )}
                    </div>
                    <p className="text-white/40 text-xs">{scan.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scanner Area */}
      <div className="flex-1 relative min-h-[300px]">
        {isScanning ? (
          <div className="absolute inset-0">
            <Scanner
              onScan={handleScan}
              onError={(error) => console.error('Scanner error:', error)}
              constraints={{
                facingMode: 'environment'
              }}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { width: '100%', height: '100%', objectFit: 'cover' }
              }}
              components={{
                audio: false,
                torch: true
              }}
            />
            
            {/* Scan overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Scan frame */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-[#007AFF] rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-[#007AFF] rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-[#007AFF] rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-[#007AFF] rounded-br-lg"></div>
              </div>
              
              {/* Scan line animation */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-transparent via-[#007AFF] to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <button
              onClick={() => setIsScanning(true)}
              className="p-8 bg-gradient-to-br from-[#007AFF] to-[#0056b3] rounded-full shadow-lg shadow-[#007AFF]/30 hover:shadow-[#007AFF]/50 transition-shadow"
              data-testid="start-scan-button"
            >
              <Camera size={48} className="text-white" />
            </button>
            <p className="text-white/60 text-sm">Toca para activar la cámara</p>
          </div>
        )}
      </div>

      {/* Result Panel */}
      <div className={`p-4 transition-all duration-300 ${STATUS_COLORS[scanStatus]}`}>
        {scanResult ? (
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {scanStatus === 'success' && <CheckCircle2 size={48} className="text-white" />}
              {scanStatus === 'denied' && <XCircle size={48} className="text-white" />}
              {scanStatus === 'warning' && <AlertTriangle size={48} className="text-white" />}
              {scanStatus === 'idle' && <Ticket size={48} className="text-white/50" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg truncate">
                {scanResult.message}
              </p>
              {scanResult.ticket && (
                <p className="text-white/80 text-sm truncate">
                  {scanResult.ticket.holderName} • {scanResult.ticket.ticketType}
                </p>
              )}
              {scanResult.ticketId && (
                <p className="text-white/60 text-xs font-mono truncate">
                  {scanResult.ticketId}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Ticket size={48} className="text-white/50" />
            <div>
              <p className="text-white/80 font-semibold">Listo para escanear</p>
              <p className="text-white/50 text-sm">Apunta la cámara al código QR del ticket</p>
            </div>
          </div>
        )}
      </div>

      {/* Scanner Controls */}
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
    </div>
  );
};

export default CheckInPage;
