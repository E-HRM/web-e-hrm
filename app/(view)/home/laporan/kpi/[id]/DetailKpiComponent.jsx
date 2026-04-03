"use client";

import Link from "next/link";
import useDetailViewModel from "./DetailViewModel";

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

function Field({ label, children, helper }) {
  return (
    <label className="block">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2">{children}</div>
      {helper ? (
        <div className="mt-2 text-xs text-slate-400">{helper}</div>
      ) : null}
    </label>
  );
}

function baseInputClass() {
  return "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
}

function formatNumber(value) {
  const safe = Number(value || 0);
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(safe) ? safe : 0);
}

function renderValue(value) {
  return value || "-";
}

export default function DetailKpiComponent({ userId }) {
  const vm = useDetailViewModel({ initialUserId: userId });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-teal-700 via-cyan-700 to-slate-800 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-teal-100">
                KPI Detail
              </p>
              <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
                Form KPI Tahunan Karyawan
              </h1>
              <p className="mt-3 text-sm leading-6 text-teal-50 md:text-base">
                Form ini khusus untuk karyawan yang dipilih dari halaman daftar
                KPI. Data jabatan dan kantor diambil langsung dari profil
                karyawan.
              </p>
            </div>
          </div>
        </div>

        {vm.notice ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {vm.notice}
          </div>
        ) : null}

        {vm.loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Memuat form KPI karyawan...
          </div>
        ) : vm.error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm">
            Gagal memuat detail KPI karyawan.
          </div>
        ) : !vm.selectedUser ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm">
            Karyawan tidak ditemukan.
          </div>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Informasi KPI
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Form KPI aktif untuk karyawan yang dipilih dari halaman
                      daftar.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Karyawan
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {renderValue(
                        vm.selectedUser?.nama || vm.form.namaKaryawan,
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Jabatan
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {renderValue(
                        vm.selectedUser?.jabatanNama || vm.form.namaJabatan,
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Kantor
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {renderValue(
                        vm.selectedUser?.locationNama || vm.form.namaLokasi,
                      )}
                    </div>
                  </div>

                  <Field label="Tahun KPI">
                    <input
                      type="number"
                      value={vm.form.tahun}
                      onChange={(event) =>
                        vm.setHeaderField("tahun", event.target.value)
                      }
                      className={baseInputClass()}
                      min="2024"
                      max="2100"
                    />
                  </Field>

                  <Field label="Status Plan">
                    <select
                      value={vm.form.status}
                      onChange={(event) =>
                        vm.setHeaderField("status", event.target.value)
                      }
                      className={baseInputClass()}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="locked">Locked</option>
                      <option value="archived">Archived</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Ringkasan Form
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ringkasan plan KPI untuk karyawan yang sedang dipilih.
                  </p>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>Mode</span>
                    <span className="font-medium text-slate-900">
                      {vm.hasExistingPlan ? "Plan tersimpan" : "Plan baru"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Karyawan</span>
                    <span className="font-medium text-slate-900">
                      {renderValue(
                        vm.selectedUser?.nama || vm.form.namaKaryawan,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Tahun</span>
                    <span className="font-medium text-slate-900">
                      {vm.form.tahun}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Status</span>
                    <span className="font-medium uppercase text-slate-900">
                      {vm.form.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Total target</span>
                    <span className="font-medium text-slate-900">
                      {formatNumber(vm.summary.totalTarget)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Update terakhir</span>
                    <span className="font-medium text-slate-900">
                      {vm.currentPlan?.updatedAt
                        ? new Date(vm.currentPlan.updatedAt).toLocaleString(
                            "id-ID",
                          )
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={vm.savePlan}
                    disabled={vm.isSaving || vm.isDeleting}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {vm.isSaving
                      ? "Menyimpan..."
                      : vm.hasExistingPlan
                        ? "Update KPI"
                        : "Simpan KPI"}
                  </button>
                  <button
                    type="button"
                    onClick={vm.deletePlan}
                    disabled={
                      !vm.hasExistingPlan || vm.isSaving || vm.isDeleting
                    }
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {vm.isDeleting ? "Menghapus..." : "Hapus KPI"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Item KPI
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Isi indikator KPI dan target tahunan untuk karyawan
                    terpilih.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={vm.addItem}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  Tambah KPI
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {vm.computedItems.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                    <div className="text-base font-medium text-slate-900">
                      Belum ada KPI
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Tambahkan item KPI untuk karyawan yang dipilih. Setiap
                      karyawan bisa memiliki KPI yang berbeda.
                    </div>
                  </div>
                ) : null}

                {vm.computedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Field label={`KPI ${item.nomor}`}>
                          <input
                            type="text"
                            value={item.namaKpi}
                            onChange={(event) =>
                              vm.updateItemField(
                                item.id,
                                "namaKpi",
                                event.target.value,
                              )
                            }
                            className={baseInputClass()}
                            placeholder="Nama KPI"
                          />
                        </Field>

                        <Field label="Satuan">
                          <input
                            type="text"
                            value={item.satuan}
                            onChange={(event) =>
                              vm.updateItemField(
                                item.id,
                                "satuan",
                                event.target.value,
                              )
                            }
                            className={baseInputClass()}
                            placeholder="contoh: siswa, sesi, rupiah"
                          />
                        </Field>

                        <Field label="Target Tahunan">
                          <input
                            type="number"
                            value={item.targetTahunan}
                            onChange={(event) =>
                              vm.updateItemField(
                                item.id,
                                "targetTahunan",
                                event.target.value,
                              )
                            }
                            className={baseInputClass()}
                            placeholder="0"
                            min="0"
                          />
                        </Field>
                      </div>

                      <button
                        type="button"
                        onClick={() => vm.removeItem(item.id)}
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Preview KPI
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Representasi ringkas item KPI tahunan yang akan disimpan.
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Satuan</th>
                      <th className="px-4 py-3">Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {vm.computedItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Belum ada item KPI untuk ditampilkan.
                        </td>
                      </tr>
                    ) : null}
                    {vm.computedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-500">
                          {item.nomor}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.namaKpi || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.satuan || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatNumber(item.target)}
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
