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
- "Seleccionar entradas" call-to-action

### ✅ Ticket Selection Modal (Completed)
- For "general" type events only
- Shows ticket types with prices (General, VIP, Platino)
- Quantity selector (+/-) for each ticket type
- Dynamic total calculation
- "Continuar" button navigates to Purchase Summary

### ✅ Seat Selection Page (Completed)
- For "seated" type events only
- Conceptual placeholder for Seats.io map integration
- Dynamic pricing summary panel
- Section/row/seat selection interface
- Responsive layout

### ✅ Purchase Summary Page (Completed)
- Uses DYNAMIC DATA from the purchase flow context
- Event summary with thumbnail, date, time, venue, city
- Selected function display (only for multi-function events)
- Ticket/Seat details with type, quantity, and pricing
- Itemized price breakdown:
  - Tickets/Seats subtotal
  - Service fee ($150)
  - Tax calculated by country (16% MXN, 8% USD, etc.)
- Currency indicator based on event country
- "Continuar al pago" primary action button
- Empty state when no selections made
- Fully responsive (desktop and mobile)

### ✅ Checkout Page (Completed)
**Left Column - Buyer Information:**
- User state detection (logged in / guest)
- Pre-fills form if logged in (First Name, Last Name, Email, Phone)
- All fields remain EDITABLE (not read-only)
- Guest checkout option (checkbox only visible if not logged in)
- Mandatory "Accept Terms and Conditions" checkbox
- Form validation with error messages

**Payment Section (Mock Stripe):**
- Mock Stripe Payment Element UI
- Card number, Expiry, CVC inputs with formatting
- Payment method tabs (Tarjeta, Apple Pay, Más)
- Stripe branding and security indicators
- "Pagar" button with total amount
- Payment processing simulation (90% success, 10% mock rejection)
- Error handling with user-friendly messages

**Right Column - Order Summary:**
- Event summary (image, title, date, time, venue)
- Selected function badge for multi-function events
- Tickets/seats breakdown
- Price summary (Subtotal, Service Fee, Tax, Total)
- Currency indicator
- "Volver al resumen" link

### ✅ Confirmation Page (Completed - Feb 10, 2026)
- Success header with animated checkmark icon
- "¡Compra exitosa!" title and confirmation message
- Order ID banner (format: ORD-timestamp)
- Purchase date/time
- Event details card:
  - Event title, date, time, venue, city
  - Tickets/Seats breakdown
- Buyer information card (Name, Email, Phone)
- Payment summary card:
  - Payment method
  - Total paid with currency
- Email notification notice
- **PDF Ticket Download (jsPDF)**: Generates unique PDF for each ticket
- **QR Code Generation**: Each ticket has unique QR with JSON data
- Copy order ID functionality
- Clears purchase context on successful display

### ✅ Staff Check-In System (Completed - Dec 2025)
- Web-based ticket scanning interface at `/checkin`
- Staff login with mock authentication (scanner1/scan123)
- Event selection screen with 3 mock events
- Camera-based QR scanner using `@yudiel/react-qr-scanner`
- Real-time validation feedback:
  - **Valid**: Green "✓ ACCESO PERMITIDO" (first scan)
  - **Denied**: Red "ACCESO DENEGADO" (re-scan)
  - **Invalid**: Yellow warning (wrong format/event)
- Live statistics: Total, Admitidos, Pendientes
- Scan history log with timestamps

### ✅ Unified Ticket Service (Completed - Dec 2025)
- `ticketService.js`: Shared mock logic for ticket generation/validation
- Ticket ID Format: `TCK-<timestamp>-<random>`
- Order ID Format: `ORD-<timestamp>`
- Event ID Format: `EVT-<id>`
- QR Code Data: JSON `{ ticketId, orderId, eventId }`
- localStorage persistence for tickets and scan logs
- Idempotent validation (prevents duplicate check-ins)

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
│   ├── PurchaseSummaryPage.jsx
│   ├── CheckoutPage.jsx
│   └── ConfirmationPage.jsx    <- NEW
├── context/
│   └── PurchaseContext.jsx     <- State management + sessionStorage persistence
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
- `/evento/:id/checkout` - Checkout Page
- `/evento/:id/confirmacion` - Confirmation Page
- `/checkin` - Staff Check-In System (NEW)

### State Management
- **PurchaseContext**: React Context for global purchase state
- **sessionStorage**: Persists state across page refreshes with key `prontoticket_purchase_state`
- **Confirmation data**: Stored in sessionStorage with key `prontoticket_confirmation`
- **Ticket Storage**: localStorage with key `prontoticket_tickets`
- **Scan Logs**: localStorage with key `prontoticket_scanned`
- **Staff Session**: localStorage with key `checkin_staff_mock`

---

## Mock Data
All data is hardcoded in `/app/frontend/src/data/mockEvents.js`

**Events with saleType property:**
- Event 1: Festival Musical (saleType = "general") - Ticket selection modal only
- Event 2: Teatro Noche de Gala (saleType = "seated") - Seat map only
- Event 3: Concierto Internacional (saleType = "general") - Ticket selection modal only

**Purchase Flow Rules:**
- `saleType = "seated"`: Shows ONLY seat map flow, NO ticket selectors
- `saleType = "general"`: Shows ONLY ticket type/quantity selection, NO seat map
- **Invalid/missing saleType**: Shows developer warning, blocks purchase

**Mock Logged-in User:**
```javascript
{
  id: 'user-123',
  firstName: 'Juan',
  lastName: 'García',
  email: 'juan.garcia@email.com',
  phone: '+52 55 1234 5678',
  isLoggedIn: true
}
```

---

## Prioritized Backlog

### P0 - Critical (Next Steps)
- **Connect Frontend to Backend**: Replace mock logic with real API calls
  - Connect purchase flow to `POST /api/orders`
  - Implement real Stripe payment integration
  - Fetch real signed QR codes from `GET /api/orders/{id}/tickets`
  - Connect Check-In scanner to `POST /api/checkin/scan`

### P1 - High Priority
- User authentication system (login/register/profile)
- Real Seats.io integration for seated events

### P2 - Medium Priority  
- Autocomplete functionality in homepage search bar
- Advanced filtering options (category, price range, date)
- Purchase history page

### P3 - Low Priority (Future)
- Real-time seat availability
- Email confirmation flow with real emails
- Multi-language support (currently UI only)

---

## Known Technical Notes
- **Babel Plugin Issue**: Complex nested imports from `mockEvents.js` can cause "Maximum call stack size exceeded" errors. Solution: Use inline mock data or simplified imports in components.
- **Project is 100% MOCKED** - No backend, no API calls, no database
- **Payment Flow**: Mock simulation with 90% success rate for demo purposes
- **Terms Checkbox**: Has overlay interception - requires force=True for automated testing

---

## Test Results (Feb 10, 2026)
- **Frontend Success Rate**: 100%
- **Complete Purchase Flow**: Verified working
- **Test Report**: `/app/test_reports/iteration_2.json`

---

## User Preferences
- **Language**: Spanish (ES)
- **Theme**: Dark mode with blue/orange accents
- **Approach**: Iterative development with visual confirmation
