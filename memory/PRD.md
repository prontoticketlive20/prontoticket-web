# ProntoTicketLive - Product Requirements Document

## Original Problem Statement
Create a modern homepage UI for an online event ticket marketplace called ProntoTicketLive.

### Product Focus
- **UI/UX ONLY** - No backend logic or integrations
- Clean, modern, lightweight design with emphasis on usability and ticket conversion
- Dark theme with blue (#007AFF) and orange (#FF9500) brand palette

---

## Implemented Features

### ✅ Homepage (Completed)
- Header with logo, navigation, language selector (ES/EN)
- Hero section with headline "Fácil, Rápido y Seguro"
- 4-field search bar (Evento, País, Ciudad, Sede/Fecha)
- Featured Events section
- Upcoming Events section
- Footer

### ✅ Event Detail Page (Completed)
- Event cover image with promotional video section
- Conditional function selector for multi-date/time events
- Event information (date, time, venue, description)
- Producer contact information block
- Event policies section
- "Comprar Entradas" call-to-action

### ✅ Seat Selection Page (Completed)
- Conceptual placeholder for Seats.io map integration
- Dynamic pricing summary panel
- Section/row/seat selection interface
- Responsive layout

### ✅ Purchase Summary Page (Updated - Feb 9, 2026)
- **Now uses DYNAMIC DATA** from the purchase flow context
- Reads selected event, function, tickets, and seats from React Context
- Event summary with thumbnail, date, time, venue
- **City and country** displayed separately
- Selected function display (only for multi-function events)
- Ticket details with type, quantity, and pricing (dynamic)
- Seat information (section, row, seat) for seated events (dynamic)
- "Libre asignación" indicator for general admission
- Itemized price breakdown calculated dynamically:
  - Tickets/Seats subtotal
  - Service fee ($150)
  - Tax calculated by country (16% MXN, 8% USD, etc.)
- **Currency indicator based on event country** (MXN, USD, EUR, etc.)
- Emphasized Total price display with currency code
- "Continuar al pago" primary action button
- "Volver y modificar selección" secondary link (navigates back appropriately)
- Policy reminder notice (non-refundable tickets)
- **Empty state** when no selections made
- Fully responsive (desktop and mobile)

### ✅ Purchase Context System (New - Feb 9, 2026)
- Created `/app/frontend/src/context/PurchaseContext.jsx`
- Manages state across the entire purchase flow:
  - Selected event
  - Selected function (for multi-date events)
  - Selected tickets (type, quantity, price)
  - Selected seats (section, row, seat, price)
- Provides computed values: subtotal, tax, total, currency
- Currency and tax rate based on event country
- Format price utility function

---

## Technical Architecture

### Frontend Stack
- React 18
- Tailwind CSS
- React Router DOM
- Lucide React (icons)
- Google Fonts (Inter, Outfit)

### File Structure
```
/app/frontend/src/
├── components/
│   ├── Header.jsx
│   ├── Hero.jsx
│   ├── SearchBar.jsx
│   ├── FeaturedEvents.jsx
│   ├── UpcomingEvents.jsx
│   ├── EventCard.jsx
│   ├── Footer.jsx
│   ├── EventDetailPage.jsx
│   ├── FunctionSelector.jsx
│   ├── SeatsSelectionPage.jsx
│   ├── TicketSelection.jsx
│   └── PurchaseSummaryPage.jsx
├── context/
│   └── PurchaseContext.jsx  <- NEW: State management for purchase flow
├── data/
│   └── mockEvents.js
├── App.js
└── index.css
```

### Routes
- `/` - Homepage
- `/evento/:id` - Event Detail Page
- `/evento/:id/asientos` - Seat Selection Page
- `/evento/:id/resumen` - Purchase Summary Page

---

## Mock Data
All data is hardcoded in `/app/frontend/src/data/mockEvents.js`
- Event 1: Festival Musical (general admission)
- Event 2: Teatro Noche de Gala (assigned seating, multi-function)

---

## Prioritized Backlog

### P1 - High Priority
- Autocomplete functionality in homepage search bar
- Advanced filtering options (category, price range)

### P2 - Medium Priority
- User authentication (profiles, purchase history)
- Checkout/payment integration page

### P3 - Low Priority (Future)
- Real-time seat availability
- Seats.io actual integration
- Email confirmation flow

---

## Known Technical Notes
- **Babel Plugin Issue**: Complex nested imports from `mockEvents.js` can cause "Maximum call stack size exceeded" errors. Solution: Use inline mock data or simplified imports in components.
- **Project is 100% MOCKED** - No backend, no API calls, no database

---

## User Preferences
- **Language**: Spanish (ES)
- **Theme**: Dark mode with blue/orange accents
- **Approach**: Iterative development with visual confirmation
