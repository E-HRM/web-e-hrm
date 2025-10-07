"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  Input,
  Button,
  Tooltip,
  Skeleton,
  Empty,
  Avatar,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  WhatsAppOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import useDetailKunjunganViewModel from "./useDetailKunjunganViewModel";

/* ====== warna tema selaras layoutmu ====== */
const TEAL_BORDER = "rgba(14,42,46,.15)";
const ACCENT_GOLD = "#E7B97A";
const SURFACE = "#FFFFFF";
const SURFACE_MUTED = "#F5F7FA";
const TEXT = "#0F172A";
const SUBTEXT = "#64748b";

const waLink = (p = "") => {
  const d = String(p).replace(/\D/g, "");
  const n = d.startsWith("0") ? `62${d.slice(1)}` : d;
  return `https://wa.me/${n}`;
};

export default function DetailKunjunganContent() {
  const qp = useSearchParams();
  const departementName = qp.get("name") || "Departemen";

  const { loading, employees = [], search, setSearch, refresh, openDetail, back } =
    useDetailKunjunganViewModel({ departementId: qp.get("id") || "", departementName }) ?? {};

  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase();
    return employees.filter((e) =>
      [e.name, e.email, e.phone].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [employees, search]);

  return (
    <div className="min-h-svh p-4 md:p-6" style={{ background: SURFACE }}>
      {/* Header */}
      <div
        className="rounded-2xl p-4 md:p-5 mb-5"
        style={{ background: SURFACE, border: `1px solid ${TEAL_BORDER}`, boxShadow: "0 6px 18px rgba(14,42,46,.06)" }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Button onClick={back} icon={<ArrowLeftOutlined />} />
            <div className="text-lg md:text-xl font-semibold" style={{ color: TEXT }}>
              Detail Kunjungan • <span style={{ color: ACCENT_GOLD }}>{departementName}</span>
            </div>
          </div>

          <div className="md:ml-auto flex gap-2 md:gap-3">
            <Input
              allowClear
              placeholder="Cari nama / email / HP…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:w-80"
            />
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={refresh} />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-2xl"
              styles={{ body: { padding: 16, background: SURFACE } }}
              style={{ border: `1px solid ${TEAL_BORDER}`, boxShadow: "0 6px 18px rgba(14,42,46,.06)" }}
            >
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="py-16 rounded-2xl"
          style={{ background: SURFACE, border: `1px solid ${TEAL_BORDER}`, boxShadow: "0 6px 18px rgba(14,42,46,.06)" }}
        >
          <Empty description={<div style={{ color: SUBTEXT }}>Tidak ada data.</div>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((e) => (
            <Card
              key={e.id || e.username}
              hoverable
              className="rounded-2xl overflow-hidden h-full group"
              styles={{ body: { padding: 0 } }}
              style={{
                background: SURFACE,
                border: `1px solid ${TEAL_BORDER}`,
                boxShadow: "0 6px 18px rgba(14,42,46,.06)",
                transition: "transform .15s ease, box-shadow .15s ease",
              }}
            >
              <div className="flex flex-col h-full">
                {/* Top */}
                <div className="p-4 flex items-start gap-3">
                  <Avatar
                    shape="square"
                    size={56}
                    src={e.avatarUrl}
                    alt={e.name}
                    style={{ border: `1px solid ${TEAL_BORDER}`, background: SURFACE_MUTED }}
                  />
                  <div className="min-w-0 w-full">
                    <div className="font-semibold text-base truncate" style={{ color: TEXT }}>
                      {e.name || "-"}
                    </div>
                    <div className="text-xs truncate" style={{ color: SUBTEXT }}>
                      {e.email || "-"} · {e.phone || "-"}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3 h-16" style={{ background: SURFACE_MUTED, border: `1px solid ${TEAL_BORDER}` }}>
                      <div className="text-[11px]" style={{ color: SUBTEXT }}>Total Kunjungan</div>
                      <div className="text-sm font-semibold" style={{ color: TEXT }}>{e.visitsCount ?? "–"}</div>
                    </div>
                    <div className="rounded-xl p-3 h-16" style={{ background: SURFACE_MUTED, border: `1px solid ${TEAL_BORDER}` }}>
                      <div className="text-[11px]" style={{ color: SUBTEXT }}>Terakhir</div>
                      <div className="text-sm font-semibold" style={{ color: TEXT }}>
                        {e.lastVisitAt ? new Date(e.lastVisitAt).toLocaleDateString() : "–"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-auto px-4 py-3" style={{ borderTop: `1px solid ${TEAL_BORDER}`, background: "#fff" }}>
                  <div className="flex items-center gap-2">
                    <Button
                      type="primary"
                      block
                      icon={<CalendarOutlined />}             
                      style={{
                        background: ACCENT_GOLD,
                        borderColor: ACCENT_GOLD,
                        color: "#fff",                         
                        fontWeight: 700,
                      }}
                      className="hover:!opacity-95"
                      onClick={() => openDetail(e)}
                    >
                      Detail Kunjungan
                    </Button>
                    <Tooltip title="WhatsApp">
                      <a href={waLink(e.phone)} target="_blank" rel="noreferrer">
                        <Button shape="circle" icon={<WhatsAppOutlined />} />
                      </a>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
