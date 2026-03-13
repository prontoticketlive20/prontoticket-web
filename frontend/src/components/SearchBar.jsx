import React, { useEffect, useState } from "react";
import { Search, MapPin, Calendar, Globe, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    q: "",
    country: "",
    city: "",
    venueDate: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    setForm({
      q: params.get("q") || "",
      country: params.get("country") || "",
      city: params.get("city") || "",
      venueDate: params.get("venueDate") || "",
    });
  }, [location.search]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (form.q.trim()) params.set("q", form.q.trim());
    if (form.country.trim()) params.set("country", form.country.trim());
    if (form.city.trim()) params.set("city", form.city.trim());
    if (form.venueDate.trim()) params.set("venueDate", form.venueDate.trim());

    navigate({
      pathname: "/",
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  const handleClear = () => {
    setForm({
      q: "",
      country: "",
      city: "",
      venueDate: "",
    });

    navigate({
      pathname: "/",
      search: "",
    });
  };

  const hasFilters =
    form.q || form.country || form.city || form.venueDate;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto">
      <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl">

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          {/* Event Name */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3.5 hover:bg-white/10 transition-all duration-200 border border-white/10">
            <Search className="text-[#007AFF] flex-shrink-0" size={18} strokeWidth={2.5} />
            <input
              type="text"
              value={form.q}
              onChange={(e) => handleChange("q", e.target.value)}
              placeholder="Nombre del evento"
              className="bg-transparent text-white text-sm placeholder:text-white/40 outline-none w-full tracking-wide"
              data-testid="search-input-event"
            />
          </div>

          {/* País */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3.5 hover:bg-white/10 transition-all duration-200 border border-white/10">
            <Globe className="text-[#FF9500] flex-shrink-0" size={18} strokeWidth={2.5} />
            <input
              type="text"
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              placeholder="País"
              className="bg-transparent text-white text-sm placeholder:text-white/40 outline-none w-full tracking-wide"
              data-testid="search-input-country"
            />
          </div>

          {/* City */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3.5 hover:bg-white/10 transition-all duration-200 border border-white/10">
            <MapPin className="text-[#007AFF] flex-shrink-0" size={18} strokeWidth={2.5} />
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Ciudad"
              className="bg-transparent text-white text-sm placeholder:text-white/40 outline-none w-full tracking-wide"
              data-testid="search-input-city"
            />
          </div>

          {/* Venue or Date */}
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-3.5 hover:bg-white/10 transition-all duration-200 border border-white/10">
            <Calendar className="text-[#FF9500] flex-shrink-0" size={18} strokeWidth={2.5} />
            <input
              type="text"
              value={form.venueDate}
              onChange={(e) => handleChange("venueDate", e.target.value)}
              placeholder="Sede o fecha"
              className="bg-transparent text-white text-sm placeholder:text-white/40 outline-none w-full tracking-wide"
              data-testid="search-input-venue"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-3">

          {/* Buscar */}
          <button
            type="submit"
            className="flex-1 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[0_8px_30px_rgba(0,122,255,0.5)] active:scale-[0.98] tracking-wide"
            data-testid="search-button"
          >
            Buscar Eventos
          </button>

          {/* Limpiar */}
          {hasFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-2 px-5 py-4 bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
            >
              <X size={16} />
              Limpiar
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default SearchBar;