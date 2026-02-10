import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PurchaseProvider } from "./context/PurchaseContext";
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

const Home = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <Hero />
      <FeaturedEvents />
      <UpcomingEvents />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <PurchaseProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/evento/:id" element={<EventDetailPage />} />
            <Route path="/evento/:id/asientos" element={<SeatsSelectionPage />} />
            <Route path="/evento/:id/resumen" element={<PurchaseSummaryPage />} />
            <Route path="/evento/:id/checkout" element={<CheckoutPage />} />
          </Routes>
        </BrowserRouter>
      </PurchaseProvider>
    </div>
  );
}

export default App;
