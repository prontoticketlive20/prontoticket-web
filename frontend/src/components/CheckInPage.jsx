import React, { useState, useEffect, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  LogIn, LogOut, Camera, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Users, Ticket, Calendar, MapPin, ChevronRight,
  History, User, Shield, CameraOff, Armchair, Tag, Clock
} from 'lucide-react';
import { 
  validateTicket, 
  getScanStats, 
  getStoredTickets,
  parseQRCodeData,
  getEventFromDB,
  getFunctionsForEvent,
  initializeDatabase
} from '../services/ticketService';

/**
 * Check-In Page for Staff
 * 
 * Validates tickets by scanning QR codes with NEW structure:
 * {
 *   ticketId: string,
 *   orderId: string,
 *   eventId: string,
 *   functionId: string | null,
 *   ticketTypeId: string,
 *   seatId: string | null,
 *   issuedAt: number
 * }
 * 
 * Features:
 * - Staff login (mock)
 * - Event selection with function filter
 * - Camera-based QR scanning
 * - Full validation (event, function, ticket status)
 * - Detailed display: Event, Función, Tipo, Asiento, Estado
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

// Events for check-in (matching database structure)
const CHECKIN_EVENTS = [
  {
    id: 'EVT-1',
    title: 'Festival Músical Verano 2025',
    date: '15 JUN 2025',
    time: '18:00',
    venue: 'Estadio Nacional',
    city: 'Ciudad de México',
    isMultiFunction: false,
    functions: [
      { id: 'FUNC-EVT1-1', date: '15 JUN 2025', time: '18:00' }
    ]
  },
  {
    id: 'EVT-2',
    title: 'Teatro: Noche de Gala',
    date: '28 JUL 2025',
    time: '20:00',
    venue: 'Teatro Metropolitan',
    city: 'Ciudad de México',
    isMultiFunction: true,
    functions: [
      { id: 'FUNC-EVT2-1', date: '28 JUL 2025', time: '15:00' },
      { id: 'FUNC-EVT2-2', date: '28 JUL 2025', time: '20:00' },
      { id: 'FUNC-EVT2-3', date: '29 JUL 2025', time: '15:00' },
      { id: 'FUNC-EVT2-4', date: '29 JUL 2025', time: '20:00' }
    ]
  },
  {
    id: 'EVT-3',
    title: 'Concierto Internacional',
    date: '10 AGO 2025',
    time: '21:00',
    venue: 'Madison Square Garden',
    city: 'Nueva York',
    isMultiFunction: false,
    functions: [
      { id: 'FUNC-EVT3-1', date: '10 AGO 2025', time: '21:00' }
    ]
  }
];

const CheckInPage = () => {
  // Initialize database on mount
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffInfo, setStaffInfo] = useState(null);
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Event & function selection
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFunction, setSelectedFunction] = useState(null);
  
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
    const savedFunction = localStorage.getItem('checkin_function_mock');
    
    if (savedStaff) {
      setStaffInfo(JSON.parse(savedStaff));
      setIsLoggedIn(true);
      
      if (savedEvent) {
        const event = JSON.parse(savedEvent);
        setSelectedEvent(event);
        
        if (savedFunction) {
          setSelectedFunction(JSON.parse(savedFunction));
        }
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
    const currentStats = getScanStats(selectedEvent?.id);
    setStats(currentStats);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
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
    setSelectedFunction(null);
    setIsScanning(false);
    setScanResult(null);
    localStorage.removeItem('checkin_staff_mock');
    localStorage.removeItem('checkin_event_mock');
    localStorage.removeItem('checkin_function_mock');
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    localStorage.setItem('checkin_event_mock', JSON.stringify(event));
    
    // If single function event, auto-select the function
    if (!event.isMultiFunction && event.functions?.length === 1) {
      setSelectedFunction(event.functions[0]);
      localStorage.setItem('checkin_function_mock', JSON.stringify(event.functions[0]));
    } else {
      setSelectedFunction(null);
      localStorage.removeItem('checkin_function_mock');
    }
    
    updateStats();
  };

  const handleSelectFunction = (func) => {
    setSelectedFunction(func);
    localStorage.setItem('checkin_function_mock', JSON.stringify(func));
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setSelectedFunction(null);
    setIsScanning(false);
    setScanResult(null);
    setScanHistory([]);
    localStorage.removeItem('checkin_event_mock');
    localStorage.removeItem('checkin_function_mock');
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
    
    // Parse QR to check format
    const parsed = parseQRCodeData(qrData);
    
    if (!parsed) {
      // Invalid QR format
      setScanResult({
        valid: false,
        status: 'invalid',
        message: 'Código QR inválido - formato no reconocido',
        errorCode: 'INVALID_FORMAT',
        timestamp: Date.now(),
        displayInfo: null
      });
      setScanStatus('warning');
      
      if (navigator.vibrate) navigator.vibrate(300);
      
      addToHistory({
        success: false,
        message: 'QR Inválido',
        ticketId: null,
        time: new Date().toLocaleTimeString()
      });
      
      setTimeout(() => setScanStatus('idle'), 3000);
      return;
    }
    
    // Build validation context
    const validationContext = {
      expectedEventId: selectedEvent?.id,
      expectedFunctionId: selectedFunction?.id || null
    };
    
    // Validate ticket
    const validation = validateTicket(qrData, validationContext);
    
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
        displayInfo: validation.displayInfo,
        time: new Date().toLocaleTimeString()
      });
    } else if (validation.status === 'used') {
      setScanStatus('denied');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      
      addToHistory({
        success: false,
        message: 'Ya utilizado',
        ticketId: validation.ticketId,
        displayInfo: validation.displayInfo,
        time: new Date().toLocaleTimeString()
      });
    } else {
      setScanStatus('warning');
      if (navigator.vibrate) navigator.vibrate(300);
      
      addToHistory({
        success: false,
        message: validation.message,
        ticketId: validation.ticketId,
        displayInfo: validation.displayInfo,
        time: new Date().toLocaleTimeString()
      });
    }
    
    // Update stats
    updateStats();
    
    // Reset status after delay
    setTimeout(() => {
      setScanStatus('idle');
    }, 4000);
    
  }, [selectedEvent, selectedFunction, lastScannedQR, scanResult]);

  const addToHistory = (entry) => {
    setScanHistory(prev => [entry, ...prev].slice(0, 50));
  };

  // ============================================
  // LOGIN SCREEN
  // ============================================
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

  // ============================================
  // EVENT SELECTION SCREEN
  // ============================================
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
            data-testid="logout-button"
          >
            <LogOut size={20} />
          </button>
        </div>
        
        {/* Event Selection */}
        <div className="mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Seleccionar Evento</h2>
          
          <div className="space-y-3">
            {CHECKIN_EVENTS.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className="w-full p-4 bg-[#121212] border border-white/10 rounded-xl text-left hover:border-[#007AFF]/50 transition-colors"
                data-testid={`event-${event.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{event.title}</h3>
                    <div className="flex items-center flex-wrap gap-3 mt-2 text-white/60 text-sm">
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {event.date}
                      </span>
                      <span className="flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {event.venue}
                      </span>
                    </div>
                    {event.isMultiFunction && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-[#FF9500]/20 text-[#FF9500] text-xs rounded-full">
                        {event.functions.length} funciones
                      </span>
                    )}
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

  // ============================================
  // FUNCTION SELECTION (for multi-function events)
  // ============================================
  if (selectedEvent.isMultiFunction && !selectedFunction) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={handleBackToEvents}
              className="text-[#007AFF] text-sm mb-1 hover:underline"
            >
              ← Volver a eventos
            </button>
            <h1 className="text-lg font-bold text-white">{selectedEvent.title}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-white/60 hover:text-white"
          >
            <LogOut size={20} />
          </button>
        </div>
        
        {/* Function Selection */}
        <div className="mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Seleccionar Función</h2>
          
          <div className="space-y-3">
            {selectedEvent.functions.map((func) => (
              <button
                key={func.id}
                onClick={() => handleSelectFunction(func)}
                className="w-full p-4 bg-[#121212] border border-white/10 rounded-xl text-left hover:border-[#FF9500]/50 transition-colors"
                data-testid={`function-${func.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FF9500]/20 flex items-center justify-center">
                      <Clock size={20} className="text-[#FF9500]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{func.date}</p>
                      <p className="text-[#FF9500] text-sm">{func.time} hrs</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/40" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN SCANNER SCREEN
  // ============================================
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
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
              <span>{selectedEvent.date}</span>
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
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-[#007AFF] text-white' : 'text-white/60 hover:text-white'}`}
              data-testid="history-button"
            >
              <History size={18} />
            </button>
            <button
              onClick={handleBackToEvents}
              className="p-2 text-white/60 hover:text-white"
              data-testid="back-button"
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${scan.success ? 'text-green-400' : 'text-red-400'}`}>
                        {scan.success ? '✓ Admitido' : '✗ ' + scan.message}
                      </p>
                      {scan.displayInfo && (
                        <div className="mt-1 text-sm">
                          {scan.displayInfo.ticketType && (
                            <p className="text-white/70">{scan.displayInfo.ticketType}</p>
                          )}
                          {scan.displayInfo.seat && (
                            <p className="text-white/60 text-xs">{scan.displayInfo.seat}</p>
                          )}
                          {scan.displayInfo.holderName && (
                            <p className="text-white/50 text-xs">{scan.displayInfo.holderName}</p>
                          )}
                        </div>
                      )}
                      {scan.ticketId && (
                        <p className="text-white/40 text-xs font-mono mt-1 truncate">{scan.ticketId}</p>
                      )}
                    </div>
                    <p className="text-white/40 text-xs flex-shrink-0 ml-2">{scan.time}</p>
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

      {/* Result Panel - Enhanced Display */}
      <div className={`transition-all duration-300 ${STATUS_COLORS[scanStatus]}`}>
        {scanResult && scanResult.displayInfo ? (
          <ResultDisplay scanResult={scanResult} scanStatus={scanStatus} />
        ) : scanResult ? (
          // Simple error display
          <div className="p-4 flex items-center space-x-4">
            <div className="flex-shrink-0">
              {scanStatus === 'warning' && <AlertTriangle size={48} className="text-white" />}
              {scanStatus === 'idle' && <Ticket size={48} className="text-white/50" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg">
                {scanResult.message}
              </p>
              {scanResult.ticketId && (
                <p className="text-white/60 text-xs font-mono truncate">
                  {scanResult.ticketId}
                </p>
              )}
            </div>
          </div>
        ) : (
          // Idle state
          <div className="p-4 flex items-center space-x-4">
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
            data-testid="stop-scan-button"
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
