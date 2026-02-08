// Mock event data
export const mockEvents = {
  '1': {
    id: '1',
    title: 'Festival Músical Verano 2025',
    type: 'general',
    date: '15 JUN 2025',
    time: '18:00',
    venue: 'Estadio Nacional',
    location: 'Ciudad de México, México',
    startingPrice: 899,
    image: 'https://images.unsplash.com/photo-1765278797923-10a027f5c69d?w=1200',
    description: 'Disfruta del festival de verano más esperado del año con los mejores artistas nacionales e internacionales.',
    ageLimit: '18+',
    doors: '17:00',
    duration: '6 horas',
    policies: [
      'Prohibido el ingreso de alimentos y bebidas',
      'No se permiten cámaras profesionales',
      'El boleto es personal e intransferible'
    ],
    ticketTypes: [
      { id: 't1', name: 'General', price: 899, available: 250 },
      { id: 't2', name: 'VIP', price: 1499, available: 80 },
      { id: 't3', name: 'Platino', price: 2499, available: 30 }
    ]
  },
  '2': {
    id: '2',
    title: 'Teatro: Noche de Gala',
    type: 'seated',
    date: '28 JUL 2025',
    time: '20:00',
    venue: 'Teatro Metropolitan',
    location: 'Ciudad de México, México',
    startingPrice: 450,
    image: 'https://images.unsplash.com/photo-1719650932800-ebb72adb2d2a?w=1200',
    description: 'Una velada espectacular de teatro y música en vivo.',
    ageLimit: 'Todas las edades',
    doors: '19:00',
    duration: '2.5 horas',
    policies: [
      'Se requiere código de vestimenta formal',
      'Prohibido el uso de celulares durante la función',
      'Los asientos son numerados y asignados'
    ],
    sections: [
      { id: 's1', name: 'Platea A', price: 1200, available: 45 },
      { id: 's2', name: 'Platea B', price: 950, available: 78 },
      { id: 's3', name: 'Palco', price: 1800, available: 12 }
    ]
  }
};
