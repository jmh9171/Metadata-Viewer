import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet with React
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface InteractiveMapProps {
  latitude: number;
  longitude: number;
  title?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude,
  longitude,
  title,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current).setView([latitude, longitude], 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add a marker for the location
    const marker = L.marker([latitude, longitude]).addTo(map);

    if (title) {
      marker.bindPopup(title).openPopup();
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, title]);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-lg">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default InteractiveMap;
