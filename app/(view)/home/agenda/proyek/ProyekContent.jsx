"use client";

import { Card, Table, Tag, Button, Skeleton } from "antd";
import useProyekViewModel from "./ProyekViewModel";

const BRAND = { accent: "#D9A96F", dark: "#0A3848" };

export default function ProyekContent() {
  const { loading, rows, refresh } = useProyekViewModel();

  const columns = [
    { title: "Proyek", dataIndex: "name", key: "name" },
    { title: "Owner", dataIndex: "owner", key: "owner" },
    { title: "Progress", dataIndex: "progress", key: "progress", render: (p) => `${p}%` },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={s === "On Track" ? "success" : s === "At Risk" ? "warning" : "default"}>
          {s}
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title="Daftar Proyek"
        extra={
          <Button style={{ background: BRAND.accent, color: BRAND.dark }} onClick={refresh}>
            Refresh
          </Button>
        }
      >
        {loading ? <Skeleton active /> : <Table rowKey="id" columns={columns} dataSource={rows} pagination={false} />}
      </Card>
    </div>
  );
}
