"use client";

import Link from "next/link";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip as RTooltip,
  Legend,
  Cell,
} from "recharts";
import useLaporanMingguanViewModel from "./useLaporanMingguanViewModel";

const KPI_CHART_COLORS = [
  "#0F766E",
  "#14B8A6",
  "#F59E0B",
  "#FB7185",
  "#6366F1",
  "#8B5CF6",
  "#22C55E",
  "#F97316",
];
const KPI_PROGRESS_COLORS = {
  actual: "#0F766E",
  remaining: "#CBD5E1",
  exceeded: "#F59E0B",
  completed: "#16A34A",
  "in-progress": "#F97316",
};

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

function MetricLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function ActivityCell({ count }) {
  const tone =
    count >= 4
      ? "bg-slate-900 text-white"
      : count >= 2
        ? "bg-slate-300 text-slate-900"
        : count === 1
          ? "bg-slate-200 text-slate-700"
          : "bg-slate-100 text-slate-400";

  return (
    <div
      className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-medium ${tone}`}
    >
      {count}
    </div>
  );
}

function badgeClass(source, status) {
  const key = `${source}:${String(status || "").toLowerCase()}`;

  if (key === "agenda:selesai" || key === "kunjungan:selesai") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (key === "agenda:diproses" || key === "kunjungan:berlangsung") {
    return "bg-amber-100 text-amber-700";
  }
  if (key === "agenda:ditunda" || key === "kunjungan:batal") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-sky-100 text-sky-700";
}

function sourceClass(source) {
  return source === "kunjungan"
    ? "bg-orange-100 text-orange-700"
    : "bg-slate-100 text-slate-700";
}

function freelanceDecisionClass(decision) {
  const value = String(decision || "pending").toLowerCase();
  if (value === "disetujui") return "bg-emerald-100 text-emerald-700";
  if (value === "ditolak") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function freelanceDecisionLabel(decision) {
  const value = String(decision || "pending").toLowerCase();
  if (value === "disetujui") return "Disetujui";
  if (value === "ditolak") return "Ditolak";
  return "Pending";
}

function freelanceWorkdayClass(status) {
  return status === "HALF_DAY"
    ? "bg-orange-100 text-orange-700"
    : "bg-sky-100 text-sky-700";
}

function freelanceWorkdayLabel(status) {
  return status === "HALF_DAY" ? "Half Day" : "Full Day";
}

function leadStatusClass(status) {
  const value = String(status || "baru").toLowerCase();
  if (["hot", "deal", "closed", "approved", "success"].includes(value)) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (["follow up", "follow-up", "process", "proses", "contacted", "qualified"].includes(value)) {
    return "bg-amber-100 text-amber-700";
  }
  if (["lost", "cancel", "canceled", "rejected"].includes(value)) {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-sky-100 text-sky-700";
}

function getActivityAnchorId(item) {
  return `activity-${item.source}-${item.id}`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;
  const title = payload[0]?.name || label || "-";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-2 space-y-1 text-xs text-slate-600">
        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <span>{item.name}</span>
            <span className="font-medium text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LaporanComponent() {
  const vm = useLaporanMingguanViewModel();
  const showKpiCompletedColumn = vm.kpiHasCompletionDelta;
  const showKpiExecutionChart = vm.showKpiExecutionChart;

  const getCurrentFridayWeekStart = () => {
    const now = dayjs().startOf("day");
    const diff = (now.day() - 5 + 7) % 7;
    return now.subtract(diff, "day").format("YYYY-MM-DD");
  };

  const moveWeek = (step) => {
    vm.setWeekStart(
      dayjs(vm.weekStart)
        .add(step * 7, "day")
        .format("YYYY-MM-DD"),
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-300">
                Weekly Report
              </p>
              <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
                Laporan Mingguan Operasional
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
                Laporan ini menggabungkan data timesheet, kunjungan klien,
                absensi, dan istirahat.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[auto_220px]">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Periode
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {vm.week.label}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveWeek(-1)}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
                  >
                    Minggu Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() => vm.setWeekStart(getCurrentFridayWeekStart())}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
                  >
                    Minggu Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWeek(1)}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
                  >
                    Minggu Berikutnya
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Filter Karyawan
                </label>
                <select
                  value={vm.selectedUserId}
                  onChange={(event) => vm.setSelectedUserId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900/40 px-3 py-2.5 text-sm text-white outline-none"
                >
                  {vm.karyawanOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="text-slate-900"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {vm.loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Memuat laporan mingguan...
          </div>
        ) : vm.error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm">
            Gagal memuat laporan mingguan.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Karyawan Aktif"
                value={vm.summary.activeUserCount}
                helper="Karyawan yang punya agenda, kunjungan, atau absensi pada minggu ini"
              />
              <StatCard
                label="Timesheet & Agenda"
                value={vm.summary.agendaCount}
                helper={`${vm.summary.agendaDone} selesai | ${vm.formatDuration(vm.summary.agendaDurationSeconds)}`}
              />
              <StatCard
                label="Kunjungan Klien"
                value={vm.summary.visitCount}
                helper={`${vm.summary.visitDone} selesai | ${vm.summary.visitRunning} berlangsung`}
              />
              <StatCard
                label="Total Item"
                value={vm.combinedFeed.length}
                helper="Gabungan agenda kerja dan kunjungan klien"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Completion Rate"
                value={vm.formatPercent(vm.summary.completionRate)}
                helper={`${vm.summary.completedTrackedItems} item selesai dari ${vm.summary.totalTrackedItems}`}
              />
              <StatCard
                label="Agenda Completion"
                value={vm.formatPercent(vm.summary.agendaCompletionRate)}
                helper={`Rata-rata durasi ${vm.formatDuration(vm.detailedInsights.avgAgendaDurationSeconds)}`}
              />
              <StatCard
                label="Visit Completion"
                value={vm.formatPercent(vm.summary.visitCompletionRate)}
                helper={`Rata-rata durasi ${vm.formatDuration(vm.detailedInsights.avgVisitDurationSeconds)}`}
              />
              <StatCard
                label="Total Durasi"
                value={vm.formatDuration(
                  vm.detailedInsights.totalDurationSeconds,
                )}
                helper="Akumulasi durasi agenda kerja dan kunjungan"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Hari Hadir"
                value={vm.attendanceSummary.presentDays}
                helper={`${vm.attendanceSummary.checkedOutCount} hari checkout tercatat`}
              />
              <StatCard
                label="Check-in Tepat Waktu"
                value={vm.formatPercent(vm.attendanceSummary.onTimeRate)}
                helper={`${vm.attendanceSummary.onTimeCount} tepat | ${vm.attendanceSummary.lateCount} terlambat`}
              />
              <StatCard
                label="Total Istirahat"
                value={vm.formatDuration(
                  vm.attendanceSummary.totalBreakSeconds,
                )}
                helper={`${vm.attendanceSummary.breakSessions} sesi | avg ${vm.formatDuration(vm.attendanceSummary.averageBreakSeconds)}`}
              />
              <StatCard
                label="Kepatuhan Lokasi"
                value={vm.formatPercent(
                  vm.attendanceSummary.locationComplianceRate,
                )}
                helper={`${vm.attendanceSummary.compliantLocationChecks} dari ${vm.attendanceSummary.evaluatedLocationChecks} check`}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Revenue"
                value={vm.formatCurrency(vm.revenueSummary.totalRevenue)}
                helper="Total revenue yang match ke karyawan terpilih"
              />
              <StatCard
                label="Transaksi Revenue"
                value={vm.revenueSummary.transactionCount}
                helper="Jumlah transaksi dari weekly sales report"
              />
              <StatCard
                label="Produk Revenue"
                value={vm.revenueSummary.productCount}
                helper="Jumlah produk unik pada periode terpilih"
              />
              <StatCard
                label="Avg Revenue"
                value={vm.formatCurrency(vm.revenueSummary.averageRevenue)}
                helper="Rata-rata revenue per transaksi"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Leads By Consultant
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Data leads berdasarkan nama consultant yang dipilih pada filter karyawan.
                  </p>
                  <div className="mt-3 text-sm text-slate-700">
                    Consultant aktif: <span className="font-semibold">{vm.selectedUserMeta?.nama || "-"}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Total Leads
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900">
                      {vm.leadsByConsultantSummary.total}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Negara
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900">
                      {vm.leadsByConsultantSummary.countryCount}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Status Dominan
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {vm.leadsByConsultantSummary.statusBreakdown[0]?.label || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {vm.leadsByConsultantLoading ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Memuat leads by consultant...
                </div>
              ) : vm.leadsByConsultantError ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                  {vm.leadsByConsultantError.message || "Gagal memuat leads by consultant."}
                </div>
              ) : vm.leadsByConsultantRows.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Tidak ada leads untuk consultant yang dipilih.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {vm.leadsByConsultantRows.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-slate-900">
                            {lead.nama}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {lead.consultantName || vm.selectedUserMeta?.nama || "-"}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${leadStatusClass(lead.status)}`}
                        >
                          {lead.status || "baru"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div>{lead.phone || "-"}</div>
                        <div>{lead.email || "-"}</div>
                        <div>{[lead.country, lead.source].filter(Boolean).join(" • ") || "-"}</div>
                        <div>Dibuat: {vm.formatDateTime(lead.createdAt)}</div>
                      </div>

                      {lead.notes ? (
                        <div className="mt-4 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                          {lead.notes}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Rekap Freelance per Supervisor
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm text-slate-500">
                    Laporan form freelance untuk periode {vm.week.label}
                  </p>
                </div>
              </div>

              {vm.freelanceWeeklyLoading ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Memuat laporan freelance mingguan...
                </div>
              ) : vm.freelanceWeeklyError ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                  Gagal memuat laporan freelance mingguan.
                </div>
              ) : vm.freelanceSupervisorRows.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Tidak ada form freelance pada minggu ini.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {vm.freelanceSupervisorRows.map((group) => (
                    <div
                      key={group.key}
                      className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                          <span className="rounded-full bg-white px-3 py-1.5 text-slate-700">
                            {group.summary.total_freelance} freelance
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {group.freelancers.map((freelance) => (
                          <div
                            key={freelance.id_freelance}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                              <div>
                                <Link
                                  href={`/home/freelance/${freelance.id_freelance}`}
                                  className="text-base font-semibold text-slate-900 no-underline hover:text-sky-700"
                                >
                                  {freelance.nama}
                                </Link>
                                <div className="mt-1 text-sm text-slate-500">
                                  {[freelance.email, freelance.kontak]
                                    .filter(Boolean)
                                    .join(" • ") || "Tanpa kontak"}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 text-xs font-medium">
                                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-700">
                                  {freelance.summary.full_day} full day
                                </span>
                                <span className="rounded-full bg-orange-100 px-3 py-1.5 text-orange-700">
                                  {freelance.summary.half_day} half day
                                </span>
                                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700">
                                  {freelance.summary.disetujui} disetujui
                                </span>
                                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">
                                  {freelance.summary.pending} pending
                                </span>
                                <span className="rounded-full bg-rose-100 px-3 py-1.5 text-rose-700">
                                  {freelance.summary.ditolak} ditolak
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                              {freelance.entries.map((entry) => (
                                <div
                                  key={entry.id_form_freelance}
                                  className="min-w-[180px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                >
                                  <div className="text-sm font-semibold text-slate-900">
                                    {dayjs(entry.tanggal_kerja).isValid()
                                      ? dayjs(entry.tanggal_kerja).format(
                                          "DD MMM YYYY",
                                        )
                                      : "-"}
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${freelanceWorkdayClass(entry.status_hari_kerja)}`}
                                    >
                                      {freelanceWorkdayLabel(
                                        entry.status_hari_kerja,
                                      )}
                                    </span>
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${freelanceDecisionClass(entry.decision)}`}
                                    >
                                      {freelanceDecisionLabel(entry.decision)}
                                    </span>
                                  </div>
                                  <div className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                                    Todo List
                                  </div>
                                  {Array.isArray(entry.todo_items) &&
                                  entry.todo_items.length > 0 ? (
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                                      {entry.todo_items.map(
                                        (todo, todoIndex) => (
                                          <li
                                            key={`${entry.id_form_freelance}-${todoIndex}`}
                                            className="flex items-start gap-2"
                                          >
                                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                                            <span>{todo}</span>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  ) : (
                                    <div className="mt-2 text-xs text-slate-500">
                                      Belum ada todo list.
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Narasi Laporan
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Ringkasan otomatis dari seluruh aktivitas yang tercatat.
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Auto Generated
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-700 md:text-base">
                  {vm.reportText}
                </p>

                {vm.narrativeBlocks.length > 0 ? (
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {vm.narrativeBlocks.map((block) => (
                      <div
                        key={block.title}
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          {block.title}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {block.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">
                  Status Minggu Ini
                </h2>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm font-medium text-slate-900">
                      Agenda Kerja
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div>Teragenda: {vm.summary.agendaPlanned}</div>
                      <div>Diproses: {vm.summary.agendaInProgress}</div>
                      <div>Selesai: {vm.summary.agendaDone}</div>
                      <div>Ditunda: {vm.summary.agendaPaused}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm font-medium text-slate-900">
                      Kunjungan Klien
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div>Teragenda: {vm.summary.visitPlanned}</div>
                      <div>Berlangsung: {vm.summary.visitRunning}</div>
                      <div>Selesai: {vm.summary.visitDone}</div>
                      <div>Batal: {vm.summary.visitCanceled}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm font-medium text-slate-900">
                      Kehadiran & Disiplin
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div>Hadir: {vm.attendanceSummary.presentDays}</div>
                      <div>Tepat waktu: {vm.attendanceSummary.onTimeCount}</div>
                      <div>Terlambat: {vm.attendanceSummary.lateCount}</div>
                      <div>
                        Lokasi patuh:{" "}
                        {vm.formatPercent(
                          vm.attendanceSummary.locationComplianceRate,
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">
                    Insight Utama
                  </div>
                  <div className="mt-3 space-y-3">
                    <MetricLine
                      label="Hari tersibuk"
                      value={
                        vm.detailedInsights.busiestDay
                          ? `${vm.detailedInsights.busiestDay.dayLabel}, ${vm.detailedInsights.busiestDay.dateLabel}`
                          : "-"
                      }
                    />
                    <MetricLine
                      label="Total item hari tersibuk"
                      value={vm.detailedInsights.busiestDay?.totalItems ?? 0}
                    />
                    <MetricLine
                      label="Top karyawan"
                      value={vm.detailedInsights.topEmployee?.user?.nama || "-"}
                    />
                    <MetricLine
                      label="Skor top karyawan"
                      value={
                        vm.detailedInsights.topEmployee?.productivityScore ?? 0
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Kehadiran & Disiplin
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ringkasan kedisiplinan berdasarkan data absensi pada periode
                    terpilih.
                  </p>
                </div>
                <div className="mt-5 space-y-3">
                  <MetricLine
                    label="Hari hadir"
                    value={vm.attendanceSummary.presentDays}
                  />
                  <MetricLine
                    label="Check-in tepat waktu"
                    value={vm.attendanceSummary.onTimeCount}
                  />
                  <MetricLine
                    label="Check-in terlambat"
                    value={vm.attendanceSummary.lateCount}
                  />
                  <MetricLine
                    label="Checkout tercatat"
                    value={vm.attendanceSummary.checkedOutCount}
                  />
                  <MetricLine
                    label="Ketepatan check-in"
                    value={vm.formatPercent(vm.attendanceSummary.onTimeRate)}
                  />
                  <MetricLine
                    label="Kepatuhan lokasi"
                    value={vm.formatPercent(
                      vm.attendanceSummary.locationComplianceRate,
                    )}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Pola Istirahat
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Akumulasi sesi istirahat yang tercatat dari data absensi
                    mingguan.
                  </p>
                </div>
                <div className="mt-5 space-y-3">
                  <MetricLine
                    label="Total sesi"
                    value={vm.attendanceSummary.breakSessions}
                  />
                  <MetricLine
                    label="Total durasi"
                    value={vm.formatDuration(
                      vm.attendanceSummary.totalBreakSeconds,
                    )}
                  />
                  <MetricLine
                    label="Rata-rata per sesi"
                    value={vm.formatDuration(
                      vm.attendanceSummary.averageBreakSeconds,
                    )}
                  />
                  <MetricLine
                    label="Over-break > 60 menit"
                    value={vm.attendanceSummary.overBreakCount}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Breakdown Agenda / Proyek
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Peringkat proyek berdasarkan volume dan durasi kerja.
                    </p>
                  </div>
                </div>

                {vm.topProjects.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    Belum ada data agenda pada periode ini.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {vm.topProjects.map((item, index) => (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              Peringkat {index + 1}
                            </div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {item.label}
                            </div>
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            <div>{item.total} item</div>
                            <div>{item.selesai} selesai</div>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-slate-800"
                            style={{
                              width: `${Math.max((item.total / Math.max(vm.topProjects[0]?.total || 1, 1)) * 100, 8)}%`,
                            }}
                          />
                        </div>
                        <div className="mt-3 text-sm text-slate-500">
                          Durasi tercatat{" "}
                          {vm.formatDuration(item.durationSeconds)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Breakdown Kunjungan
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Kategori kunjungan yang paling dominan pada minggu
                      terpilih.
                    </p>
                  </div>
                </div>

                {vm.topVisitCategories.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    Belum ada data kunjungan pada periode ini.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {vm.topVisitCategories.map((item, index) => (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              Peringkat {index + 1}
                            </div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {item.label}
                            </div>
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            <div>{item.total} kunjungan</div>
                            <div>{item.selesai} selesai</div>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-orange-100">
                          <div
                            className="h-2 rounded-full bg-orange-500"
                            style={{
                              width: `${Math.max((item.total / Math.max(vm.topVisitCategories[0]?.total || 1, 1)) * 100, 8)}%`,
                            }}
                          />
                        </div>
                        <div className="mt-3 text-sm text-slate-500">
                          Durasi tercatat{" "}
                          {vm.formatDuration(item.durationSeconds)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Revenue Mingguan
                  </h2>
                </div>
              </div>

              {vm.revenueItems.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Belum ada revenue yang cocok dengan karyawan terpilih pada
                  periode ini.
                </div>
              ) : (
                <div className="mt-5">
                  <div
                    className={`grid gap-4 ${
                      vm.revenueByProduct.length > 1
                        ? "md:grid-cols-2"
                        : "grid-cols-1"
                    } ${
                      vm.revenueByProduct.length > 2 ? "xl:grid-cols-3" : ""
                    }`}
                  >
                    {vm.revenueByProduct.slice(0, 5).map((item, index) => (
                      <div
                        key={item.key}
                        className={`rounded-2xl border border-slate-200 p-4 ${
                          vm.revenueByProduct.length === 1 ? "max-w-4xl" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              Peringkat {index + 1}
                            </div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {item.label}
                            </div>
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            <div>{vm.formatCurrency(item.totalRevenue)}</div>
                            <div>{item.totalTransactions} transaksi</div>
                          </div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-emerald-100">
                          <div
                            className="h-2 rounded-full bg-emerald-600"
                            style={{
                              width: `${Math.max((item.totalRevenue / Math.max(vm.revenueByProduct[0]?.totalRevenue || 1, 1)) * 100, 8)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {vm.kpiLoading ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Memuat data KPI mingguan...
                </div>
              ) : vm.kpiError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                  Gagal memuat perhitungan KPI mingguan.
                </div>
              ) : vm.weeklyKpiRows.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Belum ada KPI tahunan yang bisa dicocokkan dengan aktivitas
                  pada periode ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Karyawan</th>
                        <th className="px-4 py-3">KPI</th>
                        <th className="px-4 py-3">Target Tahunan</th>
                        <th className="px-4 py-3">Target / Minggu</th>
                        <th className="px-4 py-3">Aktivitas Match</th>
                        {showKpiCompletedColumn ? (
                          <th className="px-4 py-3">Selesai</th>
                        ) : null}
                        <th className="px-4 py-3">Progress</th>
                        <th className="px-4 py-3">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {vm.weeklyKpiRows.map((row) => (
                        <tr key={row.key} className="align-top">
                          <td className="px-4 py-4">
                            <div className="font-medium text-slate-900">
                              {row.userName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {row.userJabatan || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-slate-900">
                              {row.namaKpi}
                            </div>
                            <div className="text-xs text-slate-500">
                              {row.satuan || "item"}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {vm.formatNumber(row.targetTahunan)}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {vm.formatNumber(row.weeklyTarget)}
                            <div className="text-xs text-slate-400">
                              {row.weeksInYear} minggu / tahun
                            </div>
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-900">
                            {vm.formatNumber(row.actualWeekly)}
                          </td>
                          {showKpiCompletedColumn ? (
                            <td className="px-4 py-4 text-slate-600">
                              {vm.formatNumber(row.completedWeekly)}
                            </td>
                          ) : null}
                          <td className="px-4 py-4">
                            <div className="font-medium text-slate-900">
                              {vm.formatPercent(row.achievementRate)}
                            </div>
                            <div className="text-xs text-slate-400">
                              Kurang{" "}
                              {vm.formatNumber(row.remainingToWeeklyTarget)}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {row.matchedItems.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {row.matchedItems.slice(0, 3).map((item) => (
                                  <a
                                    key={`${item.source}-${item.id}`}
                                    href={`#${getActivityAnchorId(item)}`}
                                    className="text-sm text-sky-700 underline-offset-2 hover:text-sky-900 hover:underline"
                                  >
                                    {item.title ||
                                      item.projectName ||
                                      item.categoryName ||
                                      "-"}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div
              className={`grid gap-6 ${showKpiExecutionChart ? "xl:grid-cols-2" : "xl:grid-cols-1"}`}
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Diagram Lingkaran Progress KPI
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Perbandingan aktual KPI minggu ini terhadap sisa target
                      mingguan.
                    </p>
                  </div>
                </div>

                {vm.kpiProgressDonutData.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                    Belum ada data KPI yang bisa divisualkan.
                  </div>
                ) : (
                  <div className="mt-5 h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <RTooltip content={<ChartTooltip />} />
                        <Legend />
                        <Pie
                          data={vm.kpiProgressDonutData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={72}
                          outerRadius={112}
                          paddingAngle={2}
                          label={({ percent }) =>
                            `${Math.round((percent || 0) * 100)}%`
                          }
                        >
                          {vm.kpiProgressDonutData.map((item, index) => (
                            <Cell
                              key={item.key}
                              fill={
                                KPI_PROGRESS_COLORS[item.key] ||
                                KPI_CHART_COLORS[
                                  index % KPI_CHART_COLORS.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {showKpiExecutionChart ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Diagram Lingkaran Status Eksekusi KPI
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Pemisahan KPI yang sudah selesai, belum selesai, dan
                        sisa target mingguan.
                      </p>
                    </div>
                  </div>

                  {vm.kpiExecutionDonutData.length === 0 ? (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                      Belum ada progres KPI yang bisa divisualkan.
                    </div>
                  ) : (
                    <div className="mt-5 h-[340px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <RTooltip content={<ChartTooltip />} />
                          <Legend />
                          <Pie
                            data={vm.kpiExecutionDonutData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={72}
                            outerRadius={112}
                            paddingAngle={2}
                            label={({ percent }) =>
                              `${Math.round((percent || 0) * 100)}%`
                            }
                          >
                            {vm.kpiExecutionDonutData.map((item, index) => (
                              <Cell
                                key={item.key}
                                fill={
                                  KPI_PROGRESS_COLORS[item.key] ||
                                  KPI_CHART_COLORS[
                                    index % KPI_CHART_COLORS.length
                                  ]
                                }
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Timeline Harian
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Distribusi agenda kerja dan kunjungan klien untuk 7 hari
                    pada periode terpilih.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                {vm.timelineDays.map((day) => (
                  <div
                    key={day.dateKey}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      {day.dayLabel}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {day.dateLabel}
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div>Total item: {day.totalItems}</div>
                      <div>Agenda: {day.agendaCount}</div>
                      <div>Selesai agenda: {day.agendaDone}</div>
                      <div>
                        Durasi: {vm.formatDuration(day.agendaDurationSeconds)}
                      </div>
                      <div>Kunjungan: {day.visitCount}</div>
                      <div>Selesai kunjungan: {day.visitDone}</div>
                      <div>Absensi hadir: {day.attendanceCount}</div>
                      <div>Istirahat: {day.breakSessions} sesi</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Rekap Per Karyawan
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ringkasan kontribusi tiap karyawan pada minggu yang dipilih.
                  </p>
                </div>
              </div>

              {vm.employeeRows.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Belum ada data karyawan pada periode ini.
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Karyawan</th>
                        <th className="px-4 py-3">Agenda</th>
                        <th className="px-4 py-3">Kunjungan</th>
                        <th className="px-4 py-3">Kehadiran</th>
                        <th className="px-4 py-3">Istirahat</th>
                        <th className="px-4 py-3">Durasi</th>
                        <th className="px-4 py-3">Total Item</th>
                        <th className="px-4 py-3">Aktivitas Terakhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {vm.employeeRows.map((row) => {
                        const href = row.user?.id
                          ? `/home/kelola_karyawan/karyawan/${row.user.id}`
                          : null;
                        const nameNode = (
                          <div>
                            <div className="font-medium text-slate-900">
                              {row.user?.nama || "Tanpa Nama"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {[row.user?.jabatan, row.user?.departement]
                                .filter(Boolean)
                                .join(" | ") || "-"}
                            </div>
                          </div>
                        );

                        return (
                          <tr key={row.userId} className="align-top">
                            <td className="px-4 py-4">
                              {href ? (
                                <Link href={href} className="no-underline">
                                  {nameNode}
                                </Link>
                              ) : (
                                nameNode
                              )}
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {row.agendaCount} item
                              <div className="text-xs text-slate-400">
                                {row.agendaDone} selesai
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {row.visitCount} item
                              <div className="text-xs text-slate-400">
                                {row.visitDone} selesai
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {row.attendanceDays} hari
                              <div className="text-xs text-slate-400">
                                {row.onTimeCount} tepat | {row.lateCount}{" "}
                                terlambat
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {vm.formatDuration(row.breakSeconds)}
                              <div className="text-xs text-slate-400">
                                {row.breakSessions} sesi
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {vm.formatDuration(row.agendaDurationSeconds)}
                            </td>
                            <td className="px-4 py-4 font-medium text-slate-900">
                              {row.totalItems}
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {row.latestAt
                                ? vm.formatDateTime(
                                    new Date(row.latestAt).toISOString(),
                                  )
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Matriks Aktivitas Harian
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Sebaran jumlah item per karyawan untuk tiap hari dalam
                    minggu berjalan.
                  </p>
                </div>
              </div>

              {vm.dailyEmployeeMatrix.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Belum ada aktivitas yang bisa dipetakan.
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-3 py-3">Karyawan</th>
                        {vm.timelineDays.map((day) => (
                          <th
                            key={day.dateKey}
                            className="px-2 py-3 text-center"
                          >
                            {day.dayLabel}
                          </th>
                        ))}
                        <th className="px-3 py-3 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vm.dailyEmployeeMatrix.map((row) => (
                        <tr key={row.userId}>
                          <td className="px-3 py-3">
                            <div className="font-medium text-slate-900">
                              {row.user?.nama || "Tanpa Nama"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {row.user?.jabatan || "-"}
                            </div>
                          </td>
                          {row.dayValues.map((day) => (
                            <td
                              key={day.dateKey}
                              className="px-2 py-3 text-center"
                            >
                              <div className="flex justify-center">
                                <ActivityCell count={day.count} />
                              </div>
                            </td>
                          ))}
                          <td className="px-3 py-3 text-center font-semibold text-slate-900">
                            {row.totalItems}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Agenda Perlu Follow Up
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Agenda yang belum selesai dan perlu perhatian lebih dulu.
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {vm.outstandingAgenda.length} item
                  </div>
                </div>

                {vm.outstandingAgenda.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-700">
                    Tidak ada agenda terbuka. Semua agenda minggu ini sudah
                    selesai.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {vm.outstandingAgenda.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(item.source, item.status)}`}
                          >
                            {item.statusLabel}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {item.projectName}
                          </span>
                        </div>
                        <div className="mt-3 font-semibold text-slate-900">
                          {item.title}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {item.user?.nama || "-"}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                          {item.description}
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                          Mulai: {vm.formatDateTime(item.startedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Kunjungan Aktif / Belum Selesai
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Daftar kunjungan yang masih berjalan atau butuh tindak
                      lanjut.
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {vm.activeVisits.length} item
                  </div>
                </div>

                {vm.activeVisits.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-700">
                    Tidak ada kunjungan aktif. Semua kunjungan pada periode ini
                    sudah selesai.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {vm.activeVisits.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(item.source, item.status)}`}
                          >
                            {item.statusLabel}
                          </span>
                          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                            {item.categoryName}
                          </span>
                        </div>
                        <div className="mt-3 font-semibold text-slate-900">
                          {item.title}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {item.user?.nama || "-"}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                          {item.description}
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                          Jadwal: {vm.formatDateTime(item.startedAt)}{" "}
                          {item.endedAt
                            ? `- ${vm.formatDateTime(item.endedAt)}`
                            : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Highlight Penyelesaian
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Item terbaru yang sudah selesai pada minggu terpilih.
                  </p>
                </div>
              </div>

              {vm.completedHighlights.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Belum ada item selesai pada periode ini.
                </div>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {vm.completedHighlights.map((item) => (
                    <div
                      key={`${item.source}-${item.id}`}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          {item.source === "kunjungan" ? "Kunjungan" : "Agenda"}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                          {item.statusLabel}
                        </span>
                      </div>
                      <div className="mt-3 font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {item.user?.nama || "-"}
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        Selesai:{" "}
                        {vm.formatDateTime(item.endedAt || item.startedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Feed Detail Mingguan
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Urutan aktivitas terbaru dari agenda kerja dan kunjungan
                    klien.
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  {vm.combinedFeed.length} item
                </div>
              </div>

              {vm.combinedFeed.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Tidak ada data timesheet atau kunjungan klien untuk minggu
                  ini.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {vm.combinedFeed.map((item) => (
                    <div
                      key={`${item.source}-${item.id}`}
                      id={getActivityAnchorId(item)}
                      className="scroll-mt-28 rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${sourceClass(item.source)}`}
                            >
                              {item.source === "kunjungan"
                                ? "Kunjungan Klien"
                                : "Timesheet / Agenda"}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(item.source, item.status)}`}
                            >
                              {item.statusLabel}
                            </span>
                          </div>

                          <div className="mt-3 text-lg font-semibold text-slate-900">
                            {item.title}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {item.source === "kunjungan"
                              ? `Kategori: ${item.categoryName || "-"}`
                              : `Proyek: ${item.projectName || "-"}`}
                          </div>
                          <div className="mt-2 text-sm leading-6 text-slate-500">
                            {item.description || "-"}
                          </div>
                        </div>

                        <div className="min-w-[220px] rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                          <div className="font-medium text-slate-900">
                            {item.user?.nama || "Tanpa Nama"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {[item.user?.jabatan, item.user?.departement]
                              .filter(Boolean)
                              .join(" | ") || "-"}
                          </div>
                          <div className="mt-3">
                            Mulai: {vm.formatDateTime(item.startedAt)}
                          </div>
                          <div className="mt-1">
                            Selesai: {vm.formatDateTime(item.endedAt)}
                          </div>
                          <div className="mt-1">
                            Durasi: {vm.formatDuration(item.durationSeconds)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
