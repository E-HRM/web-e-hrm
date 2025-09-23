"use client";

import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

// perbaiki icon default
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

export default function GeoFenceViewer({
  lokasiIn,
  lokasiOut,
  checkIn,
  checkOut,
  height = 520,
}) {
  // Tentukan center awal yang paling relevan
  const center = useMemo(() => {
    if (checkIn) return [checkIn.lat, checkIn.lng];
    if (lokasiIn) return [lokasiIn.lat, lokasiIn.lng];
    if (checkOut) return [checkOut.lat, checkOut.lng];
    if (lokasiOut) return [lokasiOut.lat, lokasiOut.lng];
    return [-6.2, 106.8]; // fallback Jakarta
  }, [checkIn, lokasiIn, checkOut, lokasiOut]);

  // warna sederhana
  const inColor = "#22c55e";
  const outColor = "#f59e0b";
  const fenceColor = "#2563eb";

  return (
    <div className="rounded-xl overflow-hidden border relative">
      {/* Legend simple */}
      <div className="absolute top-2 left-2 z-[1000] bg-white/95 rounded-lg shadow ring-1 ring-slate-200 text-xs p-2 space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: fenceColor }}
          />
          <span>Geofence Kantor</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: inColor }}
          />
          <span>Titik Check-in</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: outColor }}
          />
          <span>Titik Check-out</span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom
        zoomControl={false}
        style={{ height, width: "100%" }}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Geofence kantor masuk */}
        {lokasiIn && (
          <>
            <Marker position={[lokasiIn.lat, lokasiIn.lng]}>
              <Popup>
                <b>{lokasiIn.nama || "Lokasi Masuk"}</b>
                <br />
                Radius: {lokasiIn.radius} m
              </Popup>
            </Marker>
            {lokasiIn.radius > 0 && (
              <Circle
                center={[lokasiIn.lat, lokasiIn.lng]}
                radius={lokasiIn.radius}
                pathOptions={{ color: fenceColor }}
              />
            )}
          </>
        )}

        {/* Geofence kantor pulang */}
        {lokasiOut && (
          <>
            <Marker position={[lokasiOut.lat, lokasiOut.lng]}>
              <Popup>
                <b>{lokasiOut.nama || "Lokasi Pulang"}</b>
                <br />
                Radius: {lokasiOut.radius} m
              </Popup>
            </Marker>
            {lokasiOut.radius > 0 && (
              <Circle
                center={[lokasiOut.lat, lokasiOut.lng]}
                radius={lokasiOut.radius}
                pathOptions={{ color: fenceColor, dashArray: "6,6" }}
              />
            )}
          </>
        )}

        {/* Titik presensi karyawan */}
        {checkIn && (
          <Marker position={[checkIn.lat, checkIn.lng]}>
            <Popup>
              <b>Check-in</b>
              <br />
              {checkIn.time ? String(checkIn.time) : "-"}
            </Popup>
          </Marker>
        )}
        {checkOut && (
          <Marker position={[checkOut.lat, checkOut.lng]}>
            <Popup>
              <b>Check-out</b>
              <br />
              {checkOut.time ? String(checkOut.time) : "-"}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
