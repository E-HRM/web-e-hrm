"use client";

import Link from "next/link";
import useKpiVideModel from "./useKpiViewModel";

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{helper}</div>
    </div>
  );
}

function renderValue(value) {
  return value || "-";
}

export default function KpiComponent() {
  const vm = useKpiVideModel();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-teal-700 via-cyan-700 to-slate-800 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-teal-100">
                KPI
              </p>
              <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
                Daftar Karyawan KPI
              </h1>
              <p className="mt-3 text-sm leading-6 text-teal-50 md:text-base">
                Pilih karyawan dari daftar ini untuk membuka halaman detail KPI.
                Form KPI sekarang berada di halaman detail per karyawan.
              </p>
            </div>

            <button
              type="button"
              onClick={vm.refresh}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Muat Ulang Referensi
            </button>
          </div>
        </div>

        {vm.notice ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {vm.notice}
          </div>
        ) : null}

        {vm.loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Memuat data karyawan...
          </div>
        ) : vm.error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm">
            Gagal memuat data karyawan untuk KPI.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Total Karyawan"
                value={vm.users.length}
                helper="Jumlah karyawan yang tersedia untuk pengelolaan KPI"
              />
              <StatCard
                label="Tahun Default"
                value={vm.form.tahun}
                helper="Tahun KPI default saat membuka halaman detail"
              />
              <StatCard
                label="Status Default"
                value={String(vm.form.status || "-").toUpperCase()}
                helper="Status awal plan KPI ketika membuat data baru"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Daftar Karyawan
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Masuk ke halaman detail KPI sesuai karyawan yang dipilih.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Total data:{" "}
                  <span className="font-semibold text-slate-900">
                    {vm.users.length}
                  </span>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Karyawan</th>
                      <th className="px-4 py-3">Jabatan</th>
                      <th className="px-4 py-3">Kantor</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {vm.users.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.nama}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {renderValue(item.jabatanNama)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {renderValue(item.locationNama)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/home/laporan/kpi/${item.id}`}
                            className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                          >
                            Buka Detail KPI
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
