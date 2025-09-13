"use client";

import { Card, Button, Space, Tooltip, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function DepartmentCard({
  name,
  count = 0,
  layout = "grid",
  onClick,
  showActions = true,
  onEdit,
  onDelete,
}) {
  // Tombol Edit/Delete (klik tidak menerus ke kartu)
  const Actions = () =>
    showActions ? (
      <Space
        size={8}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10"
      >
        {onEdit && (
          <Tooltip title="Edit">
            <Button
              size="small"
              shape="circle"
              type="text"
              icon={<EditOutlined />}
              onClick={onEdit}
              className="!text-[#D9A96F] hover:!bg-[#D9A96F]/15"
            />
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Hapus">
            <Button
              size="small"
              shape="circle"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={onDelete}
              className="hover:!bg-red-500/10"
            />
          </Tooltip>
        )}
      </Space>
    ) : null;

  // Base card gelap + body transparan
  const baseCard =
    "group relative overflow-hidden rounded-2xl !bg-[#0A3848] !text-white !border !border-white/10 " +
    "[&_.ant-card-body]:!bg-transparent shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5";

  // Efek glow (non-interaktif + berada di belakang)
  const sheen =
    "before:content-[''] before:absolute before:inset-0 before:z-0 before:pointer-events-none " +
    "before:bg-[radial-gradient(1200px_200px_at_110%_-10%,rgba(217,169,111,0.18),transparent)] before:opacity-0 " +
    "group-hover:before:opacity-100 before:transition-opacity " +
    "after:content-[''] after:absolute after:-right-24 after:-top-24 after:h-48 after:w-48 after:z-0 after:pointer-events-none " +
    "after:rounded-full after:bg-[#D9A96F]/10 after:blur-2xl after:opacity-0 group-hover:after:opacity-100 after:transition-opacity";

  const countPill =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs " +
    "border-[#D9A96F]/40 bg-[#D9A96F]/10 text-[#D9A96F]";

  // ============ LIST ============
  if (layout === "list") {
    return (
      <Card
        hoverable
        onClick={onClick}
        className={`${baseCard} ${sheen}`}
        styles={{ body: { padding: 14, background: "transparent" } }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-1 rounded-full bg-[#D9A96F]/70" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold tracking-wide text-[15px] text-[#D9A96F]">
              {name || "-"}
            </div>
            <div className="mt-1">
              <span className={countPill}>
                <TeamOutlined />
                {count} Karyawan
              </span>
            </div>
          </div>

          {showActions && <Actions />}

          <Button
            type="default"
            icon={<ArrowRightOutlined />}
            className="ml-2 bg-[#D9A96F]/15 text-[#D9A96F] hover:!bg-[#D9A96F]/25 hover:!border-[#D9A96F]"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            Detail
          </Button>
        </div>
      </Card>
    );
  }

  // ============ GRID ============
  return (
    <Card
      hoverable
      onClick={onClick}
      className={`${baseCard} ${sheen}`}
      styles={{ body: { padding: 16, background: "transparent" } }}
    >
      {/* Header */}
      <div className="relative z-10 flex items-start justify-between pb-2 border-b border-white/10">
        <div className="min-w-0">
          <div className="truncate font-semibold tracking-wide text-[15px] text-[#D9A96F]">
            {name || "-"}
          </div>
          <Text className="!text-white/60 !text-xs">Departemen</Text>
        </div>
        {showActions && <Actions />}
      </div>

      {/* Body */}
      <div className="relative z-10 mt-3 space-y-3">
        <div>
          <span className={countPill}>
            <TeamOutlined />
            {count} Karyawan
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <Text className="!text-white/70">Klik untuk lihat karyawan</Text>
          <ArrowRightOutlined className="text-white/80 group-hover:text-[#D9A96F]" />
        </div>
      </div>
    </Card>
  );
}
