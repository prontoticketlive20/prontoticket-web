// Google Maps URL helper
// Opens in Google Maps app on mobile, new tab on desktop

export const getGoogleMapsUrl = (venue, city, country) => {
  const query = encodeURIComponent(`${venue}, ${city}${country ? `, ${country}` : ''}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

// Component for clickable venue link
import React from 'react';
import { ExternalLink } from 'lucide-react';

export const VenueLink = ({ 
  venue, 
  city, 
  country, 
  className = '', 
  showIcon = false,
  children 
}) => {
  const mapsUrl = getGoogleMapsUrl(venue, city, country);
  
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center hover:text-[#007AFF] transition-colors duration-200 cursor-pointer ${className}`}
      title="Abrir en Google Maps"
      data-testid="venue-maps-link"
    >
      {children || `${venue}${city ? `, ${city}` : ''}`}
      {showIcon && <ExternalLink size={12} className="ml-1 opacity-60" />}
    </a>
  );
};
