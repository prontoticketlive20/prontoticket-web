import React, { useState, useEffect, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  LogIn, LogOut, Camera, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Users, Ticket, Calendar, MapPin, ChevronRight,
  History, BarChart3, User, Shield
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Status colors
const STATUS_COLORS = {
  success: 'bg-green-500',
  denied: 'bg-red-500',
  warning: 'bg-yellow-500',
  idle: 'bg-gray-700'
};

const CheckInPage = () => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [staffInfo, setStaffInfo] = useState(null);
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Event selection
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, success, denied, warning
  
  // Stats
  const [stats, setStats] = useState({ total_scans: 0, successful_scans: 0, denied_scans: 0 });
  const [recentScans, setRecentScans] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('checkin_token');
    const savedStaff = localStorage.getItem('checkin_staff');
    const savedEvent = localStorage.getItem('checkin_event');
    
    if (savedToken && savedStaff) {
      setSessionToken(savedToken);
      setStaffInfo(JSON.parse(savedStaff));
      setIsLoggedIn(true);
      
      if (savedEvent) {
        setSelectedEvent(JSON.parse(savedEvent));
      }
    }
  }, []);

  // Fetch events when logged in
  useEffect(() => {
    if (isLoggedIn && sessionToken) {
      fetchEvents();
    }
  }, [isLoggedIn, sessionToken]);

  // Fetch stats when event is selected
  useEffect(() => {
    if (selectedEvent && sessionToken) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [selectedEvent, sessionToken]);

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch(`${API_URL}/api/checkin/events`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
    setIsLoadingEvents(false);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/checkin/stats`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentScans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/checkin/recent-scans?limit=20`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentScans(data);
      }
    } catch (error) {
      console.error('Error fetching recent scans:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      const response = await fetch(`${API_URL}/api/checkin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessionToken(data.session_token);
        setStaffInfo({
          id: data.staff_id,
          name: data.staff_name,
          role: data.role
        });
        setIsLoggedIn(true);
        
        localStorage.setItem('checkin_token', data.session_token);
        localStorage.setItem('checkin_staff', JSON.stringify({
          id: data.staff_id,
          name: data.staff_name,
          role: data.role
        }));
      } else {
        setLoginError(data.message);
      }
    } catch (error) {
      setLoginError('Error de conexión');
    }
    
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/checkin/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setIsLoggedIn(false);
    setSessionToken(null);
    setStaffInfo(null);
    setSelectedEvent(null);
    setIsScanning(false);
    setScanResult(null);
    
    localStorage.removeItem('checkin_token');
    localStorage.removeItem('checkin_staff');
    localStorage.removeItem('checkin_event');
  };

  const handleSelectEvent = async (event) => {
    try {
      const response = await fetch(`${API_URL}/api/checkin/select-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ event_id: event.id })
      });
      
      if (response.ok) {
        setSelectedEvent(event);
        localStorage.setItem('checkin_event', JSON.stringify(event));
      }
    } catch (error) {
      console.error('Error selecting event:', error);
    }
  };

  const handleScan = useCallback(async (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    
    const qrData = detectedCodes[0].rawValue;
    if (!qrData) return;
    
    // Prevent rapid re-scanning of same QR
    if (scanResult && scanResult.qr_data === qrData && Date.now() - scanResult.timestamp < 3000) {
      return;
    }
    
    // Vibrate on scan (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    try {
      const response = await fetch(`${API_URL}/api/checkin/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ qr_data: qrData })
      });
      
      const data = await response.json();
      
      setScanResult({
        ...data,
        qr_data: qrData,
        timestamp: Date.now()
      });
      
      if (data.access_granted) {
        setScanStatus('success');
        // Vibrate pattern for success
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else if (data.error_code === 'ALREADY_USED') {
        setScanStatus('denied');
        // Vibrate pattern for denied
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      } else {
        setScanStatus('warning');
        if (navigator.vibrate) navigator.vibrate(300);
      }
      
      // Update stats
      fetchStats();
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setScanStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        access_granted: false,
        message: 'Error de conexión',
        error_code: 'CONNECTION_ERROR',
        timestamp: Date.now()
      });
      setScanStatus('warning');
    }
  }, [sessionToken, scanResult]);

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
          
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="text-[#007AFF] animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              No hay eventos disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
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
          )}
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
          <div>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {selectedEvent.title}
            </h1>
            <p className="text-white/60 text-xs flex items-center">
              <User size={10} className="mr-1" />
              {staffInfo?.name} • {selectedEvent.date}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) fetchRecentScans();
              }}
              className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-[#007AFF] text-white' : 'text-white/60 hover:text-white'}`}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => {
                setSelectedEvent(null);
                localStorage.removeItem('checkin_event');
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
            <p className="text-2xl font-bold text-white">{stats.total_scans}</p>
            <p className="text-white/50 text-xs">Total</p>
          </div>
          <div className="text-center flex-1 border-x border-white/10">
            <p className="text-2xl font-bold text-green-500">{stats.successful_scans}</p>
            <p className="text-white/50 text-xs">Admitidos</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-red-500">{stats.denied_scans}</p>
            <p className="text-white/50 text-xs">Denegados</p>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="absolute inset-0 top-[140px] bg-[#0A0A0A] z-20 overflow-y-auto p-4">
          <h3 className="text-white font-bold mb-4">Escaneos Recientes</h3>
          {recentScans.length === 0 ? (
            <p className="text-white/50 text-center py-4">No hay escaneos</p>
          ) : (
            <div className="space-y-2">
              {recentScans.map((scan, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-xl border ${scan.access_granted ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${scan.access_granted ? 'text-green-400' : 'text-red-400'}`}>
                        {scan.access_granted ? '✓ Admitido' : '✗ Denegado'}
                      </p>
                      {scan.holder_name && (
                        <p className="text-white/70 text-sm">{scan.holder_name}</p>
                      )}
                      {scan.ticket_type && (
                        <p className="text-white/50 text-xs">{scan.ticket_type}</p>
                      )}
                    </div>
                    <p className="text-white/40 text-xs">
                      {new Date(scan.scanned_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scanner Area */}
      <div className="flex-1 relative">
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
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-[#007AFF] rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-[#007AFF] rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-[#007AFF] rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-[#007AFF] rounded-br-lg"></div>
              </div>
              
              {/* Scan line animation */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 overflow-hidden">
                <div className="h-0.5 bg-[#007AFF] animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => setIsScanning(true)}
              className="p-8 bg-[#007AFF] rounded-full shadow-lg shadow-[#007AFF]/30"
              data-testid="start-scan-button"
            >
              <Camera size={48} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Result Panel */}
      <div className={`p-4 transition-colors duration-300 ${STATUS_COLORS[scanStatus]}`}>
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
              {scanResult.ticket_info && (
                <p className="text-white/80 text-sm truncate">
                  {scanResult.ticket_info.holder_name} • {scanResult.ticket_info.ticket_type}
                </p>
              )}
              {scanResult.error_code === 'ALREADY_USED' && scanResult.first_scan_at && (
                <p className="text-white/60 text-xs">
                  Usado: {new Date(scanResult.first_scan_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Ticket size={48} className="text-white/50" />
            <div>
              <p className="text-white/80 font-semibold">Listo para escanear</p>
              <p className="text-white/50 text-sm">Apunta la cámara al código QR</p>
            </div>
          </div>
        )}
      </div>

      {/* Scanner Controls */}
      {isScanning && (
        <div className="p-4 bg-[#121212] border-t border-white/10">
          <button
            onClick={() => setIsScanning(false)}
            className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl"
          >
            Detener Escáner
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;
