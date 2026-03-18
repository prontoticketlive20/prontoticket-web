import React from "react";
import "@/App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Outlet,
  Navigate,
} from "react-router-dom";
import { PurchaseProvider } from "./context/PurchaseContext";

import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import OrderDetailPage from "./pages/admin/OrderDetailPage";
import CreateEventPage from "./pages/admin/CreateEventPage";
import EventFunctionsPage from "./pages/admin/EventFunctionsPage";
import FunctionPricingPage from "./pages/admin/FunctionPricingPage";
import EventTicketTypesPage from "./pages/admin/EventTicketTypesPage";
import EditEventPage from "./pages/admin/EditEventPage";
import MyTicketsPage from "./components/MyTicketsPage";
import TicketPage from "./components/TicketPage";

import Header from "./components/Header";
import Hero from "./components/Hero";
import FeaturedEvents from "./components/FeaturedEvents";
import UpcomingEvents from "./components/UpcomingEvents";
import Footer from "./components/Footer";

import EventDetailPage from "./components/EventDetailPage";
import SeatsSelectionPage from "./components/SeatsSelectionPage";
import PurchaseSummaryPage from "./components/PurchaseSummaryPage";
import CheckoutPage from "./components/CheckoutPage";
import ConfirmationPage from "./components/ConfirmationPage";
import CheckInPage from "./components/CheckInPage";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const LayoutWithHeader = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <div className="pt-20">
        <Outlet />
      </div>
    </div>
  );
};

const HomeContent = () => {
  return (
    <>
      <Hero />
      <FeaturedEvents />
      <UpcomingEvents />
      <Footer />
    </>
  );
};

const ProducerDashboardPlaceholder = () => {
  return (
    <div className="p-6">
      <h1 className="text-white text-xl font-bold">Dashboard Producer</h1>
      <p className="text-white/60 mt-2">
        (En construcción) Aquí irá el panel del Producer: eventos, stats, edición, etc.
      </p>
    </div>
  );
};

const CustomerDashboardPlaceholder = () => {
  return (
    <div className="p-6">
      <h1 className="text-white text-xl font-bold">Mi Cuenta</h1>
      <p className="text-white/60 mt-2">
        (En construcción) Aquí irá el historial de compras y acceso a tickets.
      </p>
    </div>
  );
};

const DashboardRedirect = () => {
  const role =
    localStorage.getItem("ptl_user_role") ||
    localStorage.getItem("user_role") ||
    "";

  if (!role) return <Navigate to="/admin" replace />;

  if (role === "ADMIN") return <Navigate to="/admin" replace />;
  if (role === "SCANNER") return <Navigate to="/checkin" replace />;
  if (role === "PRODUCER") return <Navigate to="/admin" replace />;
  if (role === "CUSTOMER") return <Navigate to="/account" replace />;

  return <Navigate to="/" replace />;
};

function App() {
  return (
    <div className="App">
      <PurchaseProvider>
        <BrowserRouter>
          <ScrollToTop />

          <Routes>
            <Route element={<LayoutWithHeader />}>
              <Route path="/" element={<HomeContent />} />
              <Route path="/login" element={<Login />} />

              <Route
                path="/dashboard"
                element={
                  <AdminRoute>
                    <DashboardRedirect />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <AdminRoute allowedRoles={["ADMIN", "PRODUCER"]}>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/orders/:id"
                element={
                  <AdminRoute allowedRoles={["ADMIN"]}>
                    <OrderDetailPage />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/events/new"
                element={
                  <AdminRoute allowedRoles={["ADMIN", "PRODUCER"]}>
                    <CreateEventPage />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/events/:id/edit"
                element={
                  <AdminRoute allowedRoles={["ADMIN", "PRODUCER"]}>
                    <EditEventPage />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/events/:eventId/functions"
                element={<EventFunctionsPage />}
              />

              <Route
                path="/admin/functions/:functionId/pricing"
                element={<FunctionPricingPage />}
              />

              <Route
                path="/admin/events/:eventId/ticket-types"
                element={<EventTicketTypesPage />}
              />

              <Route
                path="/producer"
                element={
                  <AdminRoute allowedRoles={["PRODUCER", "ADMIN"]}>
                    <ProducerDashboardPlaceholder />
                  </AdminRoute>
                }
              />

              <Route
                path="/account"
                element={
                  <AdminRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
                    <CustomerDashboardPlaceholder />
                  </AdminRoute>
                }
              />

              <Route path="/evento/:id" element={<EventDetailPage />} />
              <Route path="/evento/:id/asientos" element={<SeatsSelectionPage />} />
              <Route path="/evento/:id/resumen" element={<PurchaseSummaryPage />} />
              <Route path="/evento/:id/checkout" element={<CheckoutPage />} />

              <Route
                path="/evento/:id/confirmacion/:orderId"
                element={<ConfirmationPage />}
              />

              <Route
                path="/my-tickets/:orderId"
                element={<MyTicketsPage />}
              />

              <Route
                path="/ticket/:ticketId"
                element={<TicketPage />}
              />

              <Route
                path="/checkin"
                element={
                  <ProtectedRoute>
                    <AdminRoute allowedRoles={["ADMIN", "SCANNER", "PRODUCER"]}>
                      <CheckInPage />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PurchaseProvider>
    </div>
  );
}

export default App;