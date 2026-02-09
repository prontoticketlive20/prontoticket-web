// Mock event data
// saleType: "seated" = Seat map only | "general" = Ticket selection only

const EVENT_1 = {
  id: '1',
  title: 'Festival Músical Verano 2025',
  saleType: 'general', // Shows ticket type & quantity selection ONLY
  date: '15 JUN 2025',
  time: '18:00',
  venue: 'Estadio Nacional',
  city: 'Ciudad de México',
  country: 'México',
  location: 'Ciudad de México, México',
  startingPrice: 899,
  image: 'https://images.unsplash.com/photo-1765278797923-10a027f5c69d?w=1200',
  description: 'Disfruta del festival de verano más esperado del año con los mejores artistas nacionales e internacionales.',
  ageLimit: '18+',
  doors: '17:00',
  duration: '6 horas',
  producerContact: {
    email: 'info@festivalsverano.com',
    phone: '+52 (55) 1234-5678'
  },
  functions: [
    {
      id: 'func-1',
      date: '15 JUN 2025',
      time: '18:00',
      availability: 'Disponible'
    }
  ]
};

const EVENT_2 = {
  id: '2',
  title: 'Teatro: Noche de Gala',
  saleType: 'seated', // Shows seat map ONLY
  date: '28 JUL 2025',
  time: '20:00',
  venue: 'Teatro Metropolitan',
  city: 'Ciudad de México',
  country: 'México',
  location: 'Ciudad de México, México',
  startingPrice: 450,
  image: 'https://images.unsplash.com/photo-1719650932800-ebb72adb2d2a?w=1200',
  description: 'Una velada espectacular de teatro y música en vivo.',
  ageLimit: 'Todas las edades',
  doors: '19:00',
  duration: '2.5 horas',
  producerContact: {
    email: 'contacto@teatrometropolitan.mx',
    phone: '+52 (55) 8765-4321'
  },
  functions: [
    {
      id: 'func-1',
      date: '28 JUL 2025',
      time: '15:00',
      availability: 'Disponible'
    },
    {
      id: 'func-2',
      date: '28 JUL 2025',
      time: '20:00',
      availability: 'Disponible'
    },
    {
      id: 'func-3',
      date: '29 JUL 2025',
      time: '15:00',
      availability: 'Pocas entradas'
    },
    {
      id: 'func-4',
      date: '29 JUL 2025',
      time: '20:00',
      availability: 'Disponible'
    }
  ]
};

const EVENT_3 = {
  id: '3',
  title: 'Concierto Internacional',
  saleType: 'general', // Shows ticket type & quantity selection ONLY
  date: '10 AGO 2025',
  time: '21:00',
  venue: 'Madison Square Garden',
  city: 'Nueva York',
  country: 'Estados Unidos',
  location: 'Nueva York, Estados Unidos',
  startingPrice: 150,
  image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200',
  description: 'Un concierto épico con artistas internacionales en el icónico Madison Square Garden.',
  ageLimit: 'Todas las edades',
  doors: '19:00',
  duration: '4 horas',
  producerContact: {
    email: 'info@msgconcerts.com',
    phone: '+1 (212) 555-1234'
  },
  functions: [
    {
      id: 'func-1',
      date: '10 AGO 2025',
      time: '21:00',
      availability: 'Disponible'
    }
  ]
};

export const mockEvents = {
  '1': EVENT_1,
  '2': EVENT_2,
  '3': EVENT_3
};

export const getEventPolicies = (eventId) => {
  if (eventId === '1') {
    return [
      'Prohibido el ingreso de alimentos y bebidas',
      'No se permiten cámaras profesionales',
      'El boleto es personal e intransferible'
    ];
  }
  return [
    'Se requiere código de vestimenta formal',
    'Prohibido el uso de celulares durante la función',
    'Los asientos son numerados y asignados'
  ];
};

export const getTicketOptions = (eventId) => {
  if (eventId === '1') {
    return [
      { id: 't1', name: 'General', price: 899, available: 250 },
      { id: 't2', name: 'VIP', price: 1499, available: 80 },
      { id: 't3', name: 'Platino', price: 2499, available: 30 }
    ];
  }
  return [
    { id: 's1', name: 'Platea A', price: 1200, available: 45 },
    { id: 's2', name: 'Platea B', price: 950, available: 78 },
    { id: 's3', name: 'Palco', price: 1800, available: 12 }
  ];
};
