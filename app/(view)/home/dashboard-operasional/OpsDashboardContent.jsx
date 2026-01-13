"use client";

import React from "react";
import {
  Card,
  Statistic,
  Tag,
  Table,
  Tooltip,
  Progress,
} from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useOpsDashboardViewModel from "./useOpsDashboardViewModel";

const BRAND = "#003A6F";

export default function OpsDashboardContent() {
  const {
    kpi,
    chartKunjungan7Hari,
    pieAgendaStatus,
    recentVisits,
    upcomingAgendas,
    columnsRecentVisits,
    columnsUpcomingAgendas,
  } = useOpsDashboardViewModel();

  return (
    <div className="space-y-6">
      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className="rounded-2xl shadow-sm"
          styles={{ body: { padding: 16 } }}
        >
          <Statistic
            title="Kunjungan Hari Ini"
            value={kpi.kunjunganHariIni}
            valueStyle={{ color: BRAND }}
            suffix={<Tag color="blue">live</Tag>}
          />
        </Card>

        <Card className="rounded-2xl shadow-sm" styles={{ body: { padding: 16 } }}>
          <Statistic
            title="Kunjungan Minggu Ini"
            value={kpi.kunjunganMingguIni}
            valueStyle={{ color: BRAND }}
          />
        </Card>

        <Card className="rounded-2xl shadow-sm" styles={{ body: { padding: 16 } }}>
          <Statistic
            title="Agenda Aktif"
            value={kpi.agendaAktif}
            valueStyle={{ color: BRAND }}
          />
        </Card>

        <Card className="rounded-2xl shadow-sm" styles={{ body: { padding: 16 } }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Completion Rate</div>
              <div className="text-2xl font-semibold text-gray-800">
                {kpi.completionRate}%
              </div>
            </div>
            <Tooltip title="Persentase agenda/status selesai">
              <Progress
                type="circle"
                percent={kpi.completionRate}
                size={60}
              />
            </Tooltip>
          </div>
        </Card>
      </div>

      {/* ===== Charts ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-sm xl:col-span-2" title="Kunjungan 7 Hari Terakhir" bordered>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={chartKunjungan7Hari}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Legend />
                <Bar dataKey="diproses" name="Diproses" />
                <Bar dataKey="selesai" name="Selesai" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm" title="Status Agenda" bordered>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieAgendaStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label
                >
                  {pieAgendaStatus.map((e, i) => (
                    <Cell key={i} />
                  ))}
                </Pie>
                <RTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ===== Lists ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-sm" title="Kunjungan Terbaru" bordered>
          <Table
            size="small"
            rowKey="id"
            columns={columnsRecentVisits}
            dataSource={recentVisits}
            pagination={{ pageSize: 5, size: "small" }}
          />
        </Card>

        <Card className="rounded-2xl shadow-sm" title="Agenda Mendatang" bordered>
          <Table
            size="small"
            rowKey="id"
            columns={columnsUpcomingAgendas}
            dataSource={upcomingAgendas}
            pagination={{ pageSize: 5, size: "small" }}
          />
        </Card>
      </div>
    </div>
  );
}
