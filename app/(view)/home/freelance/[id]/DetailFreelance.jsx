"use client";

import {
  ArrowLeftOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";

import useVM from "./useDetailFreelanceViewModel";

import AppButton from "../../../component_shared/AppButton";
import AppCard from "../../../component_shared/AppCard";
import AppDatePicker from "../../../component_shared/AppDatePicker";
import AppInput from "../../../component_shared/AppInput";
import AppMessage from "../../../component_shared/AppMessage";
import AppTag from "../../../component_shared/AppTag";

function renderDecisionTag(decision) {
  const value = String(decision || "pending").toLowerCase();
  if (value === "disetujui") return <AppTag tone="success">Disetujui</AppTag>;
  if (value === "ditolak") return <AppTag tone="danger">Ditolak</AppTag>;
  return <AppTag tone="warning">Pending</AppTag>;
}

function renderWorkdayTag(status) {
  if (status === "HALF_DAY") return <AppTag tone="warning">Half Day</AppTag>;
  return <AppTag tone="info">Full Day</AppTag>;
}

function InfoPill({ icon, children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm backdrop-blur">
      <span className="text-slate-400">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function SummaryCard({ label, value, accent, subtitle }) {
  return (
    <div
      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
      style={{ boxShadow: "0 12px 28px -24px rgba(15, 23, 42, 0.35)" }}
    >
      <div className="h-1.5 w-full" style={{ background: accent }} />
      <div className="p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
          {label}
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="text-4xl font-black leading-none text-slate-900">
            {value}
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ color: accent, backgroundColor: `${accent}14` }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0 last:pb-0">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="text-right text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}

export default function DetailFreelance({ freelanceId }) {
  const vm = useVM(freelanceId);
  const summary = vm.filteredSummary;
  const forms = vm.filteredForms;

  return (
    <div className="space-y-6 bg-[linear-gradient(180deg,#dff0ff_0%,#eef7ff_22%,#f8fbff_40%,#f8fafc_100%)] p-4 md:p-5">
      <AppCard
        bodyStyle={{ padding: 0 }}
        className="overflow-hidden rounded-[28px] border border-white/70 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]"
      >
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#eff6ff_100%)] p-5 md:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-[0.32em] text-slate-500">
                  Detail Freelance
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                      {vm.freelance?.nama || "Memuat data..."}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Pantau semua hari kerja freelance, detail todo list, dan
                      proses approval admin dalam satu halaman.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <InfoPill icon={<MailOutlined />}>
                  {vm.freelance?.email || "Tanpa email"}
                </InfoPill>
                <InfoPill icon={<PhoneOutlined />}>
                  {vm.freelance?.kontak || "Tanpa kontak"}
                </InfoPill>
                <InfoPill icon={<EnvironmentOutlined />}>
                  {vm.freelance?.alamat || "Tanpa alamat"}
                </InfoPill>
              </div>
            </div>

            <div className="min-w-[280px] rounded-[24px] border border-white/80 bg-white/85 p-5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.55)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#003A6F] text-lg text-white">
                  <UserOutlined />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                    Supervisor
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {vm.freelance?.supervisor?.nama_pengguna ||
                      "Belum ada supervisor"}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <MetaRow
                  label="Terakhir Update"
                  value={vm.formatDateTime(vm.freelance?.updated_at)}
                />
                <MetaRow
                  label="Total Pengajuan"
                  value={vm.summary.total_forms}
                />
                <MetaRow label="Data Ditampilkan" value={summary.total_forms} />
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard
        bodyStyle={{ padding: 20 }}
        className="rounded-[24px] border border-white/80 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              Filter Tanggal
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Filter data berdasarkan rentang tanggal kerja freelance.
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto xl:items-end">
            <div className="min-w-[320px] xl:min-w-[360px]">
              <AppDatePicker.RangePicker
                label="Rentang Tanggal Kerja"
                value={vm.dateRange}
                format="DD MMM YYYY"
                onChange={(value) => vm.setDateRange(value || [])}
              />
            </div>
            <AppButton
              variant="ghost"
              onClick={vm.clearDateRange}
              disabled={!vm.hasDateFilter}
            >
              Reset Filter
            </AppButton>
          </div>
        </div>
      </AppCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Total Form"
          value={summary.total_forms}
          accent="#003A6F"
          subtitle="data terfilter"
        />
        <SummaryCard
          label="Full Day"
          value={summary.full_day}
          accent="#2563EB"
          subtitle="hari penuh"
        />
        <SummaryCard
          label="Half Day"
          value={summary.half_day}
          accent="#D97706"
          subtitle="setengah hari"
        />
        <SummaryCard
          label="Pending"
          value={summary.pending}
          accent="#F59E0B"
          subtitle="menunggu review"
        />
        <SummaryCard
          label="Disetujui"
          value={summary.disetujui}
          accent="#10B981"
          subtitle="approved"
        />
        <SummaryCard
          label="Ditolak"
          value={summary.ditolak}
          accent="#EF4444"
          subtitle="rejected"
        />
      </div>

      {vm.loading ? (
        <AppCard bodyStyle={{ padding: 28 }}>
          <div className="py-14 text-center text-sm text-slate-500">
            Memuat detail freelance...
          </div>
        </AppCard>
      ) : vm.error ? (
        <AppCard bodyStyle={{ padding: 28 }}>
          <div className="space-y-4 py-8 text-center">
            <div className="text-base font-semibold text-rose-600">
              Gagal memuat detail freelance
            </div>
            <div className="text-sm text-slate-500">{vm.error.message}</div>
            <div>
              <AppButton
                variant="outline"
                icon={<ReloadOutlined />}
                onClick={() => vm.refresh()}
              >
                Muat Ulang
              </AppButton>
            </div>
          </div>
        </AppCard>
      ) : !forms.length ? (
        <AppCard bodyStyle={{ padding: 28 }}>
          <div className="py-14 text-center text-sm text-slate-500">
            Tidak ada data form freelance pada rentang tanggal ini.
          </div>
        </AppCard>
      ) : (
        <div className="space-y-5">
          {forms.map((item, index) => {
            const isSaving = vm.savingId === item.id_form_freelance;
            const draftNote =
              vm.noteDrafts[item.id_form_freelance] ?? item.note ?? "";

            return (
              <AppCard
                key={item.id_form_freelance}
                bodyStyle={{ padding: 0 }}
                className="overflow-hidden rounded-[28px] border border-white/80 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.45)]"
              >
                <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] px-5 py-5 md:px-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <AppTag tone="primary" variant="soft">
                          Form #{index + 1}
                        </AppTag>
                        {renderWorkdayTag(item.status_hari_kerja)}
                        {renderDecisionTag(item.decision)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                          <ClockCircleOutlined />
                          Hari Kerja
                        </div>
                        <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                          {vm.formatDate(item.tanggal_kerja)}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          Dibuat {vm.formatDateTime(item.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          Approver
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">
                          {item.approver?.nama_pengguna || "Belum ada"}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          Diproses
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">
                          {vm.formatDateTime(item.decided_at)}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          Status
                        </div>
                        <div className="mt-2">
                          {renderDecisionTag(item.decision)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 px-5 py-5 md:px-6 xl:grid-cols-[1.15fr,0.85fr]">
                  <div className="space-y-5">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <FileTextOutlined />
                        Todo List
                      </div>
                      <ol className="space-y-3">
                        {(Array.isArray(item.todo_items)
                          ? item.todo_items
                          : []
                        ).map((todo, todoIndex) => (
                          <li
                            key={`${item.id_form_freelance}-${todoIndex}`}
                            className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                          >
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#003A6F] text-[11px] font-bold text-white">
                              {todoIndex + 1}
                            </span>
                            <span className="leading-6">{todo}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <AppInput.TextArea
                        label="Catatan Admin"
                        placeholder="Tambahkan catatan untuk approval atau revisi freelance"
                        value={draftNote}
                        onChange={(event) =>
                          vm.setNoteDraft(
                            item.id_form_freelance,
                            event.target.value,
                          )
                        }
                        autoSize={{ minRows: 5, maxRows: 8 }}
                      />
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="text-sm font-bold text-slate-900">
                        Riwayat Approval
                      </div>
                      <div className="mt-4 space-y-1">
                        <MetaRow
                          label="Status"
                          value={
                            item.decision === "disetujui"
                              ? "Disetujui"
                              : item.decision === "ditolak"
                                ? "Ditolak"
                                : "Pending"
                          }
                        />
                        <MetaRow
                          label="Approver"
                          value={item.approver?.nama_pengguna || "Belum ada"}
                        />
                        <MetaRow
                          label="Diproses"
                          value={vm.formatDateTime(item.decided_at)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 md:px-6">
                  <div className="flex flex-wrap justify-end gap-2">
                    <AppButton
                      variant="ghost"
                      disabled={isSaving}
                      onClick={async () => {
                        try {
                          await vm.decide(item.id_form_freelance, "pending");
                          AppMessage.success(
                            "Form freelance dikembalikan ke pending",
                          );
                        } catch (error) {
                          AppMessage.error(
                            error?.message ||
                              "Gagal mengubah status form freelance",
                          );
                        }
                      }}
                    >
                      Reset Pending
                    </AppButton>
                    <AppButton
                      variant="danger"
                      loading={isSaving}
                      icon={<CloseOutlined />}
                      onClick={async () => {
                        try {
                          await vm.decide(item.id_form_freelance, "ditolak");
                          AppMessage.success("Form freelance berhasil ditolak");
                        } catch (error) {
                          AppMessage.error(
                            error?.message || "Gagal menolak form freelance",
                          );
                        }
                      }}
                    >
                      Tolak
                    </AppButton>
                    <AppButton
                      variant="primary"
                      loading={isSaving}
                      icon={<CheckOutlined />}
                      onClick={async () => {
                        try {
                          await vm.decide(item.id_form_freelance, "disetujui");
                          AppMessage.success(
                            "Form freelance berhasil disetujui",
                          );
                        } catch (error) {
                          AppMessage.error(
                            error?.message || "Gagal menyetujui form freelance",
                          );
                        }
                      }}
                    >
                      Setujui
                    </AppButton>
                  </div>
                </div>
              </AppCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
