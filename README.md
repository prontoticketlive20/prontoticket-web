# ProntoTicketLive - Homepage UI

Plataforma moderna de venta de tickets para eventos en vivo con diseño vibrante y dinámico.

## 🎨 Características de Diseño

### Estilo Visual
- **Tema**: Dark mode con estética de concierto nocturno
- **Colores**: Azul eléctrico (#007AFF) y naranja vibrante (#FF9500)
- **Tipografía**: Outfit (headings) + Inter (body)
- **Estilo**: Vibrante y dinámico con animaciones moderadas

### Componentes Principales

#### 1. Header
- Navegación sticky con efecto glassmorphism
- Logo oficial de ProntoTicketLive
- Links: Eventos, Sedes, Nosotros, Contacto
- Botones: "Iniciar Sesión" y "Comprar Tickets"
- Menú móvil responsive

#### 2. Hero Section
- Background de imagen de concierto en vivo
- Logo watermark sutil (opacity 15%)
- Headline principal: "Fácil, Rápido y Seguro"
- Barra de búsqueda premium con glassmorphism
- 3 campos: Nombre del evento, Ciudad, Sede o fecha
- Indicadores de confianza: 500K+ tickets, 1,200+ eventos, 98% satisfacción

#### 3. Eventos Destacados
- Icono de estrella destacada
- Grid de 3 columnas (responsive)
- Tarjetas con:
  - Imagen de alta calidad
  - Badge de fecha flotante
  - Categoría del evento
  - Título y ubicación
  - Precio desde
  - Botón "Comprar" visible en hover

#### 4. Próximos Eventos
- Grid de 4 columnas (responsive a 2 en tablet, 1 en móvil)
- 8 eventos ficticios variados:
  - Electrónica bajo las Estrellas
  - Jazz & Blues Night
  - Reggaetón Fest 2025
  - Indie Rock Showcase
  - Salsa y Más Festival
  - Hip Hop Evolution Tour
  - Tributo a los 90s
  - Banda Sinaloense en Vivo
- Botón "Cargar Más Eventos"

#### 5. Footer
- 4 columnas: Marca, Enlaces Rápidos, Políticas, Contacto
- Redes sociales: Facebook, Twitter, Instagram, YouTube
- Enlaces útiles y políticas
- Información de contacto

## 🎭 Interacciones y Animaciones

### Micro-animaciones
- **Hover en tarjetas**: Elevación (-translate-y-1) + sombra azul brillante
- **Hover en botones**: Brillo (brightness-110) + escala activa (scale-95)
- **Imágenes**: Zoom suave al hover (scale-110)
- **Header**: Backdrop blur al hacer scroll
- **Transiciones**: 300ms duration para suavidad

### Estados Hover
- Tarjetas de eventos muestran botón "Comprar"
- Links cambian de color (white/80 → white)
- Botones tienen efecto de brillo y sombra

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (1 columna)
- **Tablet**: 768px - 1024px (2 columnas)
- **Desktop**: > 1024px (3-4 columnas)

### Adaptaciones móviles
- Menú hamburguesa
- Grid colapsado a 1 columna
- Tipografía reducida
- Touch targets de 44px+

## 🎯 Elementos de Conversión

1. **CTA primario**: Botón "Comprar Tickets" (gradiente azul brillante)
2. **Search bar prominente**: Centro del hero
3. **Precios visibles**: Desde $XXX en cada tarjeta
4. **Indicadores de confianza**: Stats en hero
5. **Botones de compra**: Hover state en tarjetas

## 🛠 Tecnologías Utilizadas

- **React 19**: Componentes funcionales
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Iconos modernos
- **Google Fonts**: Outfit + Inter
- **Glassmorphism**: backdrop-blur effects

## 📦 Estructura de Componentes

```
src/
├── components/
│   ├── Header.jsx          # Navegación principal
│   ├── Hero.jsx            # Sección hero con search
│   ├── SearchBar.jsx       # Barra de búsqueda
│   ├── EventCard.jsx       # Tarjeta reutilizable
│   ├── FeaturedEvents.jsx  # Eventos destacados
│   ├── UpcomingEvents.jsx  # Próximos eventos
│   └── Footer.jsx          # Footer con links
├── App.js                  # Componente principal
├── App.css                 # Estilos globales
└── index.css               # Tailwind + variables
```

## 🎨 Paleta de Colores

```css
--primary-blue: #007AFF
--primary-orange: #FF9500
--background: #0A0A0A
--surface: #121212
--subtle: #1E1E1E
--text-primary: #FFFFFF
--text-secondary: #A1A1AA
--text-muted: #71717A
--border: #27272A
```

## ✨ Data TestIDs

Todos los elementos interactivos incluyen data-testid para testing:

- `header-logo-link`
- `nav-link-*`
- `sign-in-button`
- `get-tickets-button`
- `search-input-*`
- `search-button`
- `event-card-*`
- `buy-ticket-button-*`
- `footer-*-link`

## 🚀 Instalación y Uso

```bash
# Instalar dependencias
cd frontend
yarn install

# Iniciar servidor de desarrollo
yarn start

# La aplicación estará disponible en http://localhost:3000
```

## 📝 Notas de Implementación

- **Solo UI/UX**: No incluye backend funcional
- **Eventos ficticios**: Datos de ejemplo para demostración
- **Imágenes**: URLs de Unsplash (alta calidad)
- **Logo original**: Sin modificaciones, usado como proporcionado
- **Accesibilidad**: Focus states y touch targets optimizados
- **Performance**: Lazy loading de imágenes, animaciones optimizadas

## 🎯 Próximas Mejoras Sugeridas

1. **Sistema de filtros**: Categoría, precio, fecha, ubicación
2. **Mapa interactivo**: Visualización de sedes
3. **Sistema de favoritos**: Guardar eventos
4. **Calendario de eventos**: Vista mensual
5. **Integración de pagos**: Stripe/PayPal
6. **Sistema de reseñas**: Ratings y comentarios
7. **Notificaciones**: Alertas de eventos próximos
8. **Compartir en redes**: Social sharing
9. **Newsletter signup**: Captura de emails
10. **Chat en vivo**: Soporte al cliente

---

© 2025 ProntoTicketLive. Diseño creado con Emergent AI.
