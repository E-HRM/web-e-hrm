'use client';

import { MapContainer, TileLayer, Marker, Circle, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppMessage from '@/app/(view)/component_shared/AppMessage';

const DefaultIcon = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MeIcon = L.divIcon({
  className: 'me-marker',
  html: '<span class="me-dot"></span><span class="me-pulse"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ value, onChange, height = 360, visible = false, openVersion = 0 }) {
  const [center, setCenter] = useState([value?.lat ?? -8.65, value?.lng ?? 115.21]);
  const [radius, setRadius] = useState(typeof value?.radius === 'number' ? value.radius : 50);
  const [mePos, setMePos] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const resultsRef = useRef(null);
  const containerRef = useRef(null); // Ref untuk ResizeObserver
  const [map, setMap] = useState(null);

  // Sinkronisasi koordinat dari props
  useEffect(() => {
    if (typeof value?.lat === 'number' && typeof value?.lng === 'number') {
      setCenter([value.lat, value.lng]);
    }
  }, [value?.lat, value?.lng]);

  useEffect(() => {
    if (typeof value?.radius === 'number') {
      setRadius(value.radius);
    }
  }, [value?.radius]);

  useEffect(() => {
    if (!visible) {
      setResults([]);
      setQuery('');
    }
  }, [visible]);

  useEffect(() => {
    if (!map) return;

    // 1. Invalidate segera saat peta siap/visible
    map.invalidateSize();

    // 2. Gunakan ResizeObserver untuk memantau perubahan ukuran kontainer (misal saat animasi modal)
    // Ini lebih akurat daripada setTimeout
    let resizeObserver;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    // HAPUS setTimeout manual (t1, t2) yang menyebabkan efek "pop-in" lambat
    // Jika masih butuh delay kecil untuk safety net (jarang terjadi):
    const t = requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(t);
    };
  }, [map, openVersion, visible]);

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

  const panToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      AppMessage.warning('Geolocation tidak didukung browser ini.');
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
        AppMessage.error('Gagal mengambil lokasi: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [map]);

  const setPinToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      AppMessage.warning('Geolocation tidak didukung browser ini.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMePos([latitude, longitude]);
        handleSet(latitude, longitude, radius, { fly: true });
      },
      (err) => {
        AppMessage.error('Gagal mengambil lokasi: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [handleSet, radius]);

  // SOLUSI SEARCH: Tambahkan User-Agent dan handling yang lebih kuat
  const doSearch = useCallback(async (q) => {
    const text = q?.trim();
    if (!text) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=' + encodeURIComponent(text);

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'id,en;q=0.8',
          'User-Agent': 'AttendanceApp/1.0 (contact-developer@example.com)', // WAJIB untuk Nominatim
        },
      });

      if (!res.ok) throw new Error('Search request failed');

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
      console.error('Nominatim search error', e);
      AppMessage.error('Pencarian gagal. Periksa koneksi atau coba lagi nanti.');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!resultsRef.current) return;
      if (!resultsRef.current.contains(e.target)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const initialCenter = useMemo(() => center, []);

  const iconBtnStyle = useMemo(
    () => ({
      background: 'rgba(255,255,255,0.95)',
      borderColor: '#CBD5E1',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    }),
    []
  );

  return (
    <div
      ref={containerRef}
      className='rounded-xl overflow-hidden border relative'
    >
      <div
        className='absolute top-2 left-2 z-[1000] flex gap-2 items-start'
        style={{ pointerEvents: 'auto' }}
      >
        <div
          className='relative'
          ref={resultsRef}
        >
          <AppInput
            allowClear
            placeholder={searching ? 'Mencari…' : 'Cari tempat… lalu Enter'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={() => doSearch(query)}
            className='w-64'
            inputClassName='!rounded-lg !bg-white/95 !border-slate-300'
          />

          {results.length > 0 && (
            <div className='absolute mt-1 w-full max-h-64 overflow-auto bg-white rounded-lg shadow ring-1 ring-slate-200 text-sm'>
              {results.map((r) => (
                <AppButton
                  key={r.id}
                  variant='text'
                  className='!w-full !h-auto !py-2 !px-3 !flex !items-start !justify-start !text-left hover:!bg-slate-50'
                  onClick={() => {
                    handleSet(r.lat, r.lng);
                    setResults([]);
                    setQuery(r.display);
                  }}
                >
                  <span className='whitespace-normal'>{r.display}</span>
                </AppButton>
              ))}
            </div>
          )}
        </div>

        <AppButton
          aria-label='Pan ke lokasi saya'
          variant='outline'
          shape='circle'
          className='!w-9 !h-9 !p-0'
          style={iconBtnStyle}
          onClick={panToMyLocation}
          title='Pan kamera ke lokasi saya'
        >
          <svg
            viewBox='0 0 24 24'
            width='18'
            height='18'
            fill='none'
            stroke='currentColor'
            className='text-slate-700'
          >
            <circle
              cx='12'
              cy='12'
              r='3'
              strokeWidth='2'
            />
            <path
              d='M12 2v3M12 19v3M2 12h3M19 12h3'
              strokeWidth='2'
            />
          </svg>
        </AppButton>

        <AppButton
          aria-label='Set pin ke lokasi saya'
          variant='outline'
          shape='circle'
          className='!w-9 !h-9 !p-0'
          style={iconBtnStyle}
          onClick={setPinToMyLocation}
          title='Set pin ke lokasi saya'
        >
          <svg
            viewBox='0 0 24 24'
            width='18'
            height='18'
            fill='none'
            stroke='currentColor'
            className='text-slate-700'
          >
            <path
              d='M12 21s7-4.35 7-10A7 7 0 0 0 5 11c0 5.65 7 10 7 10Z'
              strokeWidth='2'
            />
            <path
              d='M12 8v6M9 11h6'
              strokeWidth='2'
            />
          </svg>
        </AppButton>
      </div>

      <MapContainer
        whenCreated={setMap}
        center={initialCenter}
        zoom={17}
        scrollWheelZoom
        zoomControl={false}
        style={{ height, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <ZoomControl position='bottomright' />
        <ClickHandler onClick={(lat, lng) => handleSet(lat, lng)} />
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
        {!!radius && radius > 0 && (
          <Circle
            center={center}
            radius={radius}
          />
        )}
        {Array.isArray(mePos) && (
          <Marker
            position={mePos}
            icon={MeIcon}
            interactive={false}
          />
        )}
      </MapContainer>

      <AppTypography.Text
        size={12}
        tone='secondary'
        className='p-2 block'
      >
        Klik peta atau tarik pin untuk mengubah koordinat. Ketik nama tempat lalu tekan <b>Enter</b> untuk mencari.
      </AppTypography.Text>

      <style
        jsx
        global
      >{`
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
          background: #3b82f6;
          border: 2px solid #ffffff;
          border-radius: 9999px;
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