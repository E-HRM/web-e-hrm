"use client";

import {
  Table,
  Card,
  Button,
  Select,
  Tooltip,
  Popconfirm,
  Alert,
  Tag,
} from "antd";
import useHariKerjaAllViewModel, { DAYS_ID } from "./useHariKerjaAllViewModel";

/** Kartu mini di setiap sel hari */
function PolaMiniCell({ value, options, onChange, jamLabel, changed }) {
  return (
    <div
      className={[
        "rounded-xl border bg-white p-2 min-w-[160px]",
        changed ? "border-amber-400" : "border-slate-300",
      ].join(" ")}
    >
      <Select
        size="small"
        className="w-full"
        value={value ?? ""}
        options={options}
        onChange={(v) => onChange(v || null)}
        placeholder="Pilih"
        optionFilterProp="label"
        showSearch
        dropdownMatchSelectWidth={240}
      />
      <div className="mt-1 text-xs text-slate-500 min-h-[18px]">
        {value ? jamLabel : "— Libur —"}
      </div>
    </div>
  );
}

export default function HariKerjaAllContent() {
  const vm = useHariKerjaAllViewModel();

  const polaOptions = [{ value: "", label: "— Libur —" }].concat(
    vm.polaList.map((p) => ({
      value: p.id_pola_kerja || p.id,
      label: p.nama_pola_kerja || p.name,
    }))
  );

  const dataSource = vm.users.map((u) => ({ key: u.id_user, user: u }));

  const dayColumns = DAYS_ID.map((hari) => ({
    title: <div className="text-center text-slate-700 font-medium">{hari}</div>,
    key: hari,
    width: 210,
    render: (_, record) => {
      const uid = record.user.id_user;
      const polaId = vm.picked[uid]?.[hari] ?? null;
      const jam = vm.previewJamLabel(polaId);
      const changed = vm.isCellDirty(uid, hari);
      return (
        <PolaMiniCell
          value={polaId}
          options={polaOptions}
          onChange={(v) => vm.setPola(uid, hari, v)}
          jamLabel={jam || ""}
          changed={changed}
        />
      );
    },
  }));

  const columns = [
    {
      title: <div className="text-slate-600 text-sm font-medium">Nama</div>,
      key: "nama",
      fixed: "left",
      width: 340,
      render: (_, record) => {
        const u = record.user;
        const pv = vm.buildPreviewLines(u.id_user);
        const dirty = vm.isUserDirty(u.id_user);
        return (
          <div className="py-2 pr-3">
            <div className="flex items-center gap-2">
              <div className="text-slate-900 font-semibold leading-tight">
                {u.nama_pengguna}
              </div>
              {dirty && <Tag color="gold">Belum disimpan</Tag>}
            </div>
            <div className="text-slate-500 text-xs">{u.email}</div>

            <div className="mt-2 flex items-center gap-2">
              <Tooltip title="Simpan 7 hari untuk karyawan ini">
                <Button
                  type="primary"
                  size="small"
                  className="rounded-lg"
                  loading={vm.saving[u.id_user] || false}
                  disabled={!dirty}
                  onClick={() => vm.saveUser(u.id_user)}
                >
                  Simpan
                </Button>
              </Tooltip>

              {dirty && (
                <Tooltip title="Batalkan perubahan yang belum disimpan">
                  <Button
                    size="small"
                    className="rounded-lg"
                    onClick={() => vm.discardUser(u.id_user)}
                  >
                    Batalkan
                  </Button>
                </Tooltip>
              )}

              <Popconfirm
                title="Hapus semua jadwal minggu (7 hari) user ini?"
                okText="Ya, hapus"
                cancelText="Batal"
                onConfirm={() => vm.resetUser(u.id_user, { hard: false })}
              >
                <Button danger size="small" className="rounded-lg">
                  Reset
                </Button>
              </Popconfirm>
            </div>

            {/* Preview: kosong = Libur */}
            <div className="mt-3 text-xs text-slate-600">
              {pv.map((ln) => (
                <div key={ln.key}>
                  <span className="inline-block w-10">{ln.dayAbbr}:</span>{" "}
                  {ln.text || "Libur"}
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    ...dayColumns,
  ];

  return (
    <div className="p-6">
      {/* Header halaman */}
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Pola Kerja - Hari Kerja</h1>
        <div className="ml-auto flex items-center gap-2" />
      </div>

      <Card className="shadow-sm border-slate-200">
        {/* INFO di paling atas card, DI ATAS filter */}
        <div className="text-sm text-slate-600 mb-3">
          Saat <b>Simpan</b> ditekan, pilihan 7 hari disimpan sebagai <b>template mingguan</b> dan
          otomatis berlaku setiap minggu. Kolom kosong berarti <b>LIBUR</b>.
        </div>

        {/* Banner dirty global */}
        {vm.dirtyCount > 0 && (
          <Alert
            className="mb-3"
            type="warning"
            showIcon
            message={`${vm.dirtyCount} karyawan memiliki perubahan yang belum disimpan`}
            action={
              <div className="flex gap-2">
                <Button type="primary" size="small" onClick={vm.saveAll}>
                  Simpan semua
                </Button>
                <Button size="small" onClick={vm.discardAll}>
                  Batalkan semua
                </Button>
              </div>
            }
          />
        )}

        {/* Filter divisi */}
        <div className="mb-3 flex items-center gap-8">
          <Select
            className="w-56"
            placeholder="Semua Tim/Divisi"
            value={vm.deptId ?? undefined}
            onChange={vm.setDeptId}
            allowClear
            options={[{ value: null, label: "Semua Tim/Divisi" }, ...vm.deptOptions]}
          />
        </div>

        {/* Tabel jadwal mingguan */}
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          loading={vm.loadingAll}
          sticky
          scroll={{ x: "max-content", y: 640 }}
          size="middle"
          bordered={false}
          className="rounded-2xl overflow-hidden"
        />
      </Card>
    </div>
  );
}
