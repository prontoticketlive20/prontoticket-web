/**
 * Check-in page data constants
 * Separated to avoid babel plugin stack overflow issues
 */

// Mock staff accounts
export const MOCK_STAFF = [
  { username: 'admin', password: 'admin123', name: 'Administrador', role: 'admin' },
  { username: 'scanner1', password: 'scan123', name: 'Scanner 1', role: 'scanner' },
  { username: 'scanner2', password: 'scan123', name: 'Scanner 2', role: 'scanner' }
];

// Events for check-in (matching database structure)
export const CHECKIN_EVENTS = [
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

// Status colors
export const STATUS_COLORS = {
  success: 'bg-green-500',
  denied: 'bg-red-500',
  warning: 'bg-yellow-500',
  idle: 'bg-gray-700'
};
