"use client";

function RowLate({ r }) {
  return (
    <div className="grid grid-cols-12 items-center py-3 border-b last:border-none border-slate-100">
      <div className="col-span-1 text-sm text-slate-500">{r.rank}</div>
      <div className="col-span-6">
        <div className="text-sm font-medium text-slate-800">{r.name}</div>
        <div className="text-xs text-slate-500">{r.division}</div>
      </div>
      <div className="col-span-2 text-sm font-semibold">{r.count}</div>
      <div className="col-span-3 text-right text-sm">{r.duration}</div>
    </div>
  );
}

function RowDiscipline({ r }) {
  return (
    <div className="grid grid-cols-12 items-center py-3 border-b last:border-none border-slate-100">
      <div className="col-span-1 text-sm text-slate-500">{r.rank}</div>
      <div className="col-span-8">
        <div className="text-sm font-medium text-slate-800">{r.name}</div>
        <div className="text-xs text-slate-500">{r.division}</div>
      </div>
      <div className="col-span-3 text-right text-sm font-semibold">{r.score}</div>
    </div>
  );
}

export default function Top5Section({ leftRows = [], rightRows = [] }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl shadow-sm p-4">
        <div className="text-sm font-medium text-slate-800 mb-3">
          Top 5 Karyawan Paling Sering Terlambat
        </div>
        <div className="grid grid-cols-12 text-[11px] text-slate-400 px-1 mb-2">
          <div className="col-span-1">No</div>
          <div className="col-span-6">Nama Karyawan</div>
          <div className="col-span-2">Jumlah</div>
          <div className="col-span-3 text-right">Total Durasi</div>
        </div>
        <div className="bg-[#FAFAFB] rounded-xl p-2">
          {leftRows.map((r) => (
            <RowLate key={r.rank} r={r} />
          ))}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl shadow-sm p-4">
        <div className="text-sm font-medium text-slate-800 mb-3">
          Top 5 Karyawan Paling Disiplin
        </div>
        <div className="grid grid-cols-12 text-[11px] text-slate-400 px-1 mb-2">
          <div className="col-span-1">No</div>
          <div className="col-span-8">Nama Karyawan</div>
          <div className="col-span-3 text-right">Skor</div>
        </div>
        <div className="bg-[#FAFAFB] rounded-xl p-2">
          {rightRows.map((r) => (
            <RowDiscipline key={r.rank} r={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
