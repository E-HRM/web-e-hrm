"use client";

import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

// Perbaiki icon default Leaflet di bundler Next.js
// (tanpa ini, marker tidak muncul)
const DefaultIcon = L.icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ value, onChange, height = 360 }) {
  const [center, setCenter] = useState([
    value?.lat ?? -8.65, // default Bali Utara-ish
    value?.lng ?? 115.21,
  ]);
  const [radius, setRadius] = useState(value?.radius ?? 50);

  // Sinkronkan state internal dengan props dari Form
  useEffect(() => {
    if (typeof value?.lat === "number" && typeof value?.lng === "number") {
      setCenter([value.lat, value.lng]);
    }
    if (typeof value?.radius === "number") {
      setRadius(value.radius);
    }
  }, [value?.lat, value?.lng, value?.radius]);

  const handleSet = (lat, lng, r = radius) => {
    setCenter([lat, lng]);
    onChange?.({ lat, lng, radius: r });
  };

  return (
    <div className="rounded-xl overflow-hidden border">
      <MapContainer
        center={center}
        zoom={17}
        scrollWheelZoom
        style={{ height, width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onClick={(lat, lng) => handleSet(lat, lng)} />
        <Marker
          position={center}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const m = e.target;
              const { lat, lng } = m.getLatLng();
              handleSet(lat, lng);
            },
          }}
        />
        {!!radius && radius > 0 && <Circle center={center} radius={radius} />}
      </MapContainer>

      <div className="p-2 text-xs text-gray-600">
        Klik peta atau tarik pin untuk mengubah koordinat.
      </div>
    </div>
  );
}
