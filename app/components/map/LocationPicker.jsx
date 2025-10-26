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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// Perbaiki icon default Leaflet di bundler Next.js
const DefaultIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

/**
 * Props:
 * - value: {lat, lng, radius}
 * - onChange({lat, lng, radius})
 * - height: number (px)
 * - visible: boolean (true saat modal open)
 * - openVersion: number (bertambah setiap modal selesai terbuka) — memicu invalidateSize
 */
export default function LocationPicker({
  value,
  onChange,
  height = 360,
  visible = false,
  openVersion = 0,
}) {
  const [center, setCenter] = useState([
    value?.lat ?? -8.65,
    value?.lng ?? 115.21,
  ]);
  const [radius, setRadius] = useState(
    typeof value?.radius === "number" ? value.radius : 50
  );

  // posisi user (indikator)
  const [mePos, setMePos] = useState(null);

  // search UI
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
    }
    if (typeof value?.radius === "number") {
      setRadius(value.radius);
    }
  }, [value?.lat, value?.lng, value?.radius]);

  // Invalidasi ukuran peta saat modal SELESAI dibuka (menghindari peta abu)
  useEffect(() => {
    if (!map) return;
    // openVersion diubah di parent via afterOpenChange(true)
    // jalankan beberapa kali untuk amankan reflow modal
    const tick = () => {
      try {
        map.invalidateSize();
      } catch (_) {}
    };
    const t1 = setTimeout(tick, 50);
    const t2 = setTimeout(tick, 250);
    const t3 = setTimeout(tick, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map, openVersion]);

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

  // HANYA pan kamera ke lokasi saya (tidak mengubah nilai form / pin)
  const panToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung browser ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMePos([latitude, longitude]);
        if (map) {
          const targetZoom = Math.max(map.getZoom() || 0, 17);
          map.stop();
          map.flyTo([latitude, longitude], targetZoom, { duration: 0.7 });
        }
      },
      (err) => {
        alert("Gagal mengambil lokasi: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [map]);

  // SET PIN ke lokasi saya (ini yang mengubah nilai form)
  const setPinToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung browser ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMePos([latitude, longitude]);
        handleSet(latitude, longitude, radius, { fly: true });
      },
      (err) => {
        alert("Gagal mengambil lokasi: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [handleSet, radius]);

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
          headers: { "Accept-Language": "id,en;q=0.8" },
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

  // Center untuk MapContainer
  const initialCenter = useMemo(() => center, []); // dipakai hanya saat mount

  return (
    <div className="rounded-xl overflow-hidden border relative">
      {/* Overlay Controls (Search + buttons) */}
      <div
        className="absolute top-2 left-2 z-[1000] flex gap-2 items-start"
        style={{ pointerEvents: "auto" }}
      >
        {/* Search box */}
        <div className="relative" ref={resultsRef}>
          <input
            type="text"
            className="px-3 py-2 rounded-lg shadow ring-1 ring-slate-300 bg-white/95 text-sm w-64 outline-none"
            placeholder={searching ? "Mencari…" : "Cari tempat… lalu Enter"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                doSearch(query);
              }
            }}
          />
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
                    setQuery(r.display);
                  }}
                >
                  {r.display}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tombol: Pan ke lokasiku */}
        <button
          aria-label="Pan ke lokasi saya"
          className="p-2 rounded-full bg-white/95 shadow ring-1 ring-slate-300 hover:bg-white transition inline-flex items-center justify-center"
          onClick={panToMyLocation}
          title="Pan kamera ke lokasi saya (tidak mengubah pin)"
        >
          {/* crosshair icon */}
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" className="text-slate-700">
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeWidth="2" />
          </svg>
        </button>

        {/* Tombol: Set pin ke lokasiku */}
        <button
          aria-label="Set pin ke lokasi saya"
          className="p-2 rounded-full bg-white/95 shadow ring-1 ring-slate-300 hover:bg-white transition inline-flex items-center justify-center"
          onClick={setPinToMyLocation}
          title="Set pin ke lokasi saya (mengubah nilai form)"
        >
          {/* pin+ icon */}
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" className="text-slate-700">
            <path d="M12 21s7-4.35 7-10A7 7 0 0 0 5 11c0 5.65 7 10 7 10Z" strokeWidth="2"/>
            <path d="M12 8v6M9 11h6" strokeWidth="2" />
          </svg>
        </button>
      </div>

      <MapContainer
        whenCreated={setMap}
        center={initialCenter}
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

        {/* Klik peta = set pin */}
        <ClickHandler onClick={(lat, lng) => handleSet(lat, lng)} />

        {/* Pin utama (yang tersimpan) */}
        <Marker
          position={center}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const m = e.target;
              const { lat, lng } = m.getLatLng();
              handleSet(lat, lng, radius, { fly: false });
            },
          }}
        />
        {!!radius && radius > 0 && <Circle center={center} radius={radius} />}

        {/* Indikator lokasi saya (non-persisten) — DOT + PULSE */}
        {Array.isArray(mePos) && <Marker position={mePos} icon={MeIcon} interactive={false} />}
      </MapContainer>

      <div className="p-2 text-xs text-gray-600">
        Klik peta atau tarik pin untuk mengubah koordinat. Ketik nama tempat
        lalu tekan <b>Enter</b> untuk mencari. Tombol <b>pan</b> hanya menggeser
        kamera; tombol <b>set pin</b> akan memindahkan pin ke lokasimu.
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
