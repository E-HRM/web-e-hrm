"use client";

export default function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl ring-1 ring-gray-100 bg-white px-4 py-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
