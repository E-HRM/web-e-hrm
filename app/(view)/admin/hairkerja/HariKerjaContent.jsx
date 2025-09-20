"use client";

import {
  Card,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Typography,
  Checkbox,
} from "antd";
import dayjs from "dayjs";
import useHariKerjaViewModel, { DAYS_ID } from "./useHariKerjaViewModel";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;

export default function HariKerjaContent({ userId, userName }) {
  const vm = useHariKerjaViewModel({ userId });

  // local state untuk pertama kali ambil nilai dari vm.hydrated
  const [rows, setRows] = useState(() =>
    DAYS_ID.map((d) => ({ hari: d, polaId: null }))
  );
  useEffect(() => {
    setRows(
      DAYS_ID.map((d) => ({
        hari: d,
        polaId: vm.hydrated[d] ?? null,
      }))
    );
  }, [vm.hydrated]);

  const polaOptions = useMemo(() => {
    const opts = [{ value: "", label: "— Libur —" }];
    for (const p of vm.polaList) {
      opts.push({
        value: p.id_pola_kerja || p.id,
        label: p.nama_pola_kerja || p.name,
      });
    }
    return opts;
  }, [vm.polaList]);

  const columns = [
    {
      title: "Hari",
      dataIndex: "hari",
      width: 120,
      render: (h) => <Text strong>{h}</Text>,
    },
    {
      title: "Pola Kerja",
      dataIndex: "polaId",
      width: 260,
      render: (polaId, record, idx) => (
        <Select
          className="w-full"
          options={polaOptions}
          value={polaId ?? ""}
          onChange={(val) => {
            const v = val || null;
            setRows((prev) => {
              const arr = [...prev];
              arr[idx] = { ...arr[idx], polaId: v };
              return arr;
            });
            vm.setPola(record.hari, v);
          }}
          placeholder="Pilih Pola / Libur"
          showSearch
          optionFilterProp="label"
        />
      ),
    },
    {
      title: "Jam Kerja (preview)",
      key: "jam",
      render: (_, rec) => {
        const pv = vm.previewJam(rec.polaId);
        return pv.kerja ? pv.kerja : <Tag color="default">Libur</Tag>;
      },
    },
    {
      title: "Istirahat (preview)",
      key: "ist",
      render: (_, rec) => {
        const pv = vm.previewJam(rec.polaId);
        return pv.istirahat || "—";
      },
      width: 180,
    },
    {
      title: "Maks. Istirahat",
      key: "maks",
      render: (_, rec) => {
        const pv = vm.previewJam(rec.polaId);
        return pv.maks != null ? `${pv.maks} menit` : "—";
      },
      width: 140,
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <span>Atur Hari Kerja</span>
          {userName && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {userName}
            </Tag>
          )}
        </div>
      }
      bordered
    >
      <div className="mb-4 flex items-center gap-12">
        <div className="flex items-center gap-8">
          <div>
            <div className="text-xs text-slate-500">Berlaku mulai</div>
            <DatePicker
              value={vm.startDate}
              onChange={(d) => vm.setStartDate(d)}
              allowClear={false}
            />
          </div>
          <div>
            <div className="text-xs text-slate-500">Sampai (opsional)</div>
            <DatePicker
              value={vm.endDate}
              onChange={(d) => vm.setEndDate(d)}
              placeholder="Tanpa batas"
            />
          </div>
        </div>

        <div className="ml-auto">
          <Space>
            <Checkbox defaultChecked disabled>
              Ulang tiap minggu
            </Checkbox>
            <Button
              type="primary"
              onClick={vm.apply}
              loading={vm.loading}
            >
              Terapkan
            </Button>
          </Space>
        </div>
      </div>

      <Table
        size="middle"
        rowKey="hari"
        dataSource={rows}
        columns={columns}
        pagination={false}
        loading={vm.loading}
      />

      <div className="mt-4 text-xs text-slate-500">
        * Jika kolom "Pola Kerja" dikosongkan maka hari tersebut diset{" "}
        <b>LIBUR</b>. Jam & istirahat diambil dari data <b>Pola Kerja</b>.
      </div>
    </Card>
  );
}
