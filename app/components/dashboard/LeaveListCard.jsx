"use client";

export default function LeaveListCard({ items }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Karyawan Cuti</p>
        <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">5/12</span>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={it.avatar}
                alt={it.name}
                className="size-8 rounded-full object-cover ring-1 ring-gray-200"
              />
              <span className="text-sm">{it.name}</span>
            </div>
            <span className="text-xs rounded-full bg-rose-50 text-rose-600 px-2 py-1">
              {it.days || "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
