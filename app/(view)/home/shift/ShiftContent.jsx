"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Row, Col, Input, Select, Button, Space, Tooltip, Card, Empty } from "antd";
import { AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons";
import DepartmentCard from "../../../components/card/DepartementCard"; // re-use
import { useDepartementViewModel } from "../departement/useDepartementViewModel";

export default function ShiftContent() {
  const router = useRouter();
  const { divisions, departementLoading } = useDepartementViewModel();

  const [layout, setLayout] = useState("grid");   // "grid" | "list"
  const [orderBy, setOrderBy] = useState("name"); // "name" | "members"
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const base = Array.isArray(divisions) ? divisions : [];
    const s = q.trim().toLowerCase();
    let res = s ? base.filter(d => (d?.name || "").toLowerCase().includes(s)) : base.slice();
    if (orderBy === "name") {
      res.sort((a,b) => (a?.name||"").localeCompare(b?.name||""));
    } else {
      res.sort((a,b) => (b?.count||0) - (a?.count||0));
    }
    return res;
  }, [divisions, q, orderBy]);

  const goDetail = (d) => {
    router.push(`/home/shift/detail_shift?id=${encodeURIComponent(d.id)}&name=${encodeURIComponent(d.name)}`);
  };

  return (
    <div className="space-y-4 px-4 md:px-6 lg:px-8 py-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-semibold">Shift</h2>

        {/* kiri: Search + Urutkan */}
        <div className="flex items-center gap-2 ml-auto md:ml-6">
          <Input.Search
            allowClear
            placeholder="Cari departemen…"
            onSearch={setQ}
            onChange={(e) => setQ(e.target.value)}
            className="w-52"
          />
          <Select
            value={orderBy}
            onChange={setOrderBy}
            className="w-44"
            options={[
              { value: "name", label: "Urutkan: Nama" },
              { value: "members", label: "Urutkan: Jumlah Karyawan" },
            ]}
          />
        </div>

        {/* kanan: Toggle tampilan */}
        <div className="flex items-center gap-2">
          <Space.Compact>
            <Tooltip title="Tampilan Grid">
              <Button
                type={layout === "grid" ? "primary" : "default"}
                icon={<AppstoreOutlined />}
                onClick={() => setLayout("grid")}
              />
            </Tooltip>
            <Tooltip title="Tampilan List">
              <Button
                type={layout === "list" ? "primary" : "default"}
                icon={<UnorderedListOutlined />}
                onClick={() => setLayout("list")}
              />
            </Tooltip>
          </Space.Compact>
        </div>
      </div>

      {/* Grid/List (tanpa edit/delete) */}
      {filtered.length === 0 ? (
        <Card loading={departementLoading}>
          <Empty description="Belum ada departemen" />
        </Card>
      ) : layout === "grid" ? (
        <Row gutter={[16, 16]}>
          {filtered.map((d) => (
            <Col key={d.id} xs={24} sm={12} xl={8} xxl={6}>
              <DepartmentCard
                name={d.name}
                count={d.count}
                layout="grid"
                onClick={() => goDetail(d)}
                showActions={false} // <— penting
              />
            </Col>
          ))}
        </Row>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <DepartmentCard
              key={d.id}
              name={d.name}
              count={d.count}
              layout="list"
              onClick={() => goDetail(d)}
              showActions={false} // <— penting
            />
          ))}
        </div>
      )}
    </div>
  );
}
