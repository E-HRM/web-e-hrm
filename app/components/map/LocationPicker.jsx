"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// Perbaiki icon default Leaflet di bundler Next.js
const DefaultIcon = L.icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Icon khusus untuk "Lokasi saya" (dot + pulse)
const MeIcon = L.divIcon({
  className: "me-marker",
  html: `<span class="me-dot"></span><span class="me-pulse"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10], // center
});

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
    value?.lat ?? -8.65,
    value?.lng ?? 115.21,
  ]);
  const [radius, setRadius] = useState(value?.radius ?? 50);

  // posisi user (indikator)
  const [mePos, setMePos] = useState(null);

  // search UI state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const resultsRef = useRef(null);

  // instance map agar bisa flyTo
  const [map, setMap] = useState(null);

  // Sinkronkan state internal dengan props dari Form
  useEffect(() => {
    if (typeof value?.lat === "number" && typeof value?.lng === "number") {
      setCenter([value.lat, value.lng]);
      if (map) map.flyTo([value.lat, value.lng], map.getZoom() || 17, { duration: 0.4 });
    }
    if (typeof value?.radius === "number") {
      setRadius(value.radius);
    }
  }, [value?.lat, value?.lng, value?.radius, map]);

  // Set pin utama + (opsional) flyTo
  const handleSet = useCallback(
    (lat, lng, r = radius, opts = { fly: true }) => {
      setCenter([lat, lng]);
      if (opts.fly && map) {
        map.stop();
        map.flyTo([lat, lng], map.getZoom() || 17, { duration: 0.4 });
      }
      onChange?.({ lat, lng, radius: r });
    },
    [onChange, radius, map]
  );

  // Geolokasi: kamera follow titik GPS, lalu pindahkan pin tanpa fly kedua
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung browser ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMePos([latitude, longitude]);
        if (map) {
          map.stop();
          map.flyTo([latitude, longitude], Math.max(map.getZoom() || 0, 17), {
            duration: 0.7,
          });
        }
        // pindahkan pin + update form tanpa fly (kamera sudah digerakkan di atas)
        handleSet(latitude, longitude, radius, { fly: false });
      },
      (err) => {
        alert("Gagal mengambil lokasi: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [map, handleSet, radius]);

  // Nominatim Search (Enter)
  const doSearch = useCallback(
    async (q) => {
      const text = q?.trim();
      if (!text) {
        setResults([]);
        return;
      }
      try {
        setSearching(true);
        const url =
          "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=" +
          encodeURIComponent(text);
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "id,en;q=0.8",
          },
        });
        const json = await res.json();
        setResults(
          (json || []).map((it) => ({
            id: it.place_id,
            display: it.display_name,
            lat: Number(it.lat),
            lng: Number(it.lon),
            type: it.type,
          }))
        );
      } catch (e) {
        console.error("Nominatim search error", e);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  // Close results dropdown saat klik di luar
  useEffect(() => {
    const onDocClick = (e) => {
      if (!resultsRef.current) return;
      if (!resultsRef.current.contains(e.target)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Pastikan map fit ukuran kontainer (misal setelah modal dibuka)
  useEffect(() => {
    if (!map) return;
    const tick = () => map.invalidateSize();
    // jalankan beberapa kali untuk amankan reflow modal
    const t1 = setTimeout(tick, 50);
    const t2 = setTimeout(tick, 250);
    const t3 = setTimeout(tick, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);

  return (
    <div className="rounded-xl overflow-hidden border relative">
      {/* Overlay Controls (Search + Mark my location) */}
      <div
        className="absolute top-2 left-2 z-[1000] flex gap-2 items-center"
        style={{ pointerEvents: "auto" }}
      >
        <div className="relative" ref={resultsRef}>
          {/* Dropdown Hasil */}
          {results.length > 0 && (
            <div className="absolute mt-1 w-full max-h-64 overflow-auto bg-white rounded-lg shadow ring-1 ring-slate-200 text-sm">
              {results.map((r) => (
                <button
                  key={r.id}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50"
                  onClick={() => {
                    handleSet(r.lat, r.lng); 
                    setResults([]);
                  }}
                >
                  {r.display}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tombol Tandai Lokasi Saya — follow camera + pindahkan pin */}
        <button
          aria-label="Tandai lokasi saya"
          className="p-2 rounded-full bg-white/95 shadow ring-1 ring-slate-300 hover:bg-white transition inline-flex items-center justify-center"
          onClick={locateMe}
          title="Tandai lokasi saya (set pin & kamera ke posisi saat ini)"
        >
          {/* crosshair icon */}
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            className="text-slate-700"
          >
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeWidth="2" />
          </svg>
        </button>
      </div>

      <MapContainer
        whenCreated={setMap}
        center={center}
        zoom={17}
        scrollWheelZoom
        zoomControl={false}
        style={{ height, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Zoom control di pojok kanan bawah agar tidak nabrak UI kiri-atas */}
        <ZoomControl position="bottomright" />

        <ClickHandler onClick={(lat, lng) => handleSet(lat, lng)} />

        {/* Pin utama (yang tersimpan) */}
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

        {/* Indikator lokasi saya (non-persisten) — DOT + PULSE */}
        {Array.isArray(mePos) && (
          <Marker position={mePos} icon={MeIcon} interactive={false} />
        )}
      </MapContainer>

      <div className="p-2 text-xs text-gray-600">
        Klik peta atau tarik pin untuk mengubah koordinat. Ketik nama tempat
        lalu tekan <b>Enter</b> untuk mencari. Tombol <b>Tandai lokasi saya</b>
        akan memindahkan pin dan kamera ke posisi Anda sekarang.
      </div>

      {/* CSS animasi pulse */}
      <style jsx global>{`
        .me-marker {
          position: relative;
        }
        .me-marker .me-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 10px;
          transform: translate(-50%, -50%);
          background: #3b82f6; /* blue-500 */
          border: 2px solid #ffffff;
          border-radius: 9999px;
          box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
        }
        .me-marker .me-pulse {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 10px;
          transform: translate(-50%, -50%);
          border: 3px solid #3b82f6;
          border-radius: 9999px;
          opacity: 0.7;
          animation: me-pulse 1.8s ease-out infinite;
        }
        @keyframes me-pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.7;
          }
          70% {
            transform: translate(-50%, -50%) scale(2.4);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
