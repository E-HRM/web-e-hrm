"use client";

export default function StatCard({ title, value, trend, tone = "neutral" }) {
  const toneClass =
    tone === "primary"
      ? "bg-[#E7B97A]/15 text-[#C99A5B] ring-[#E7B97A]/30"
      : "bg-white text-gray-800 ring-gray-100";

  return (
    <div className={`rounded-2xl ring-1 ${toneClass} px-4 py-4`}>
      <p className="text-sm opacity-70">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold leading-none">{value}</p>
        {trend ? <span className="text-xs opacity-70">{trend}</span> : null}
      </div>
    </div>
  );
}
