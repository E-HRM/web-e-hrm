"use client";

import React from "react";
import { Button, Dropdown, Badge, Tabs, Empty } from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import useNotificationViewModel from "./useNotificationViewModel";

function renderTypeIcon(type) {
  if (type === "absensi") return <CheckCircleOutlined />;
  if (type === "shift") return <ExclamationCircleOutlined />;
  return <ClockCircleOutlined />;
}

export default function NotificationContent() {
  const {
    items,
    unreadCount,
    filteredItems,
    activeTabKey,
    setActiveTabKey,
    markAllRead,
    markOneRead,
    formatRelativeTime,
  } = useNotificationViewModel();

  const renderItem = (it) => (
    <button
      key={it.id}
      onClick={() => markOneRead(it.id)}
      className={`w-full text-left px-3 py-2 rounded-xl transition
        ${
          it.read
            ? "bg-white hover:bg-slate-50"
            : "bg-amber-50 hover:bg-amber-100"
        }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full
            ${
              it.type === "absensi"
                ? "bg-emerald-100 text-emerald-700"
                : it.type === "shift"
                ? "bg-sky-100 text-sky-700"
                : "bg-slate-100 text-slate-700"
            }`}
        >
          {renderTypeIcon(it.type)}
        </div>

        <div className="min-w-0">
          <div className="font-medium text-slate-800 line-clamp-1">
            {it.title}
          </div>
          <div className="text-xs text-slate-600 line-clamp-2">
            {it.desc}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {formatRelativeTime(it.time)}
          </div>
        </div>

        {!it.read && (
          <span className="ml-auto mt-1 inline-block h-2 w-2 rounded-full bg-red-500" />
        )}
      </div>
    </button>
  );

  const dropdownWithTabs = (
    <div
      className="rounded-2xl border border-slate-200 bg-white shadow-xl"
      style={{ width: 360, overflow: "hidden" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white/60 backdrop-blur">
        <div>
          <div className="font-semibold text-slate-800">Notifikasi</div>
          <div className="text-xs text-slate-500">
            {unreadCount} belum dibaca
          </div>
        </div>
        <Button size="small" onClick={markAllRead}>
          Tandai semua dibaca
        </Button>
      </div>

      {/* Tabs */}
      <div className="px-2 pt-2">
        <Tabs
          size="small"
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={[
            { key: "all", label: "Semua" },
            { key: "unread", label: "Belum Dibaca" },
          ]}
          tabBarGutter={12}
          animated
          destroyInactiveTabPane
        />
      </div>

      {/* List */}
      {filteredItems?.length ? (
        <div className="px-2 pb-2 max-h-[60vh] overflow-auto space-y-2">
          {filteredItems.map(renderItem)}
        </div>
      ) : (
        <div className="px-4 py-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-slate-500 text-sm">
                {activeTabKey === "unread"
                  ? "Tidak ada notifikasi baru"
                  : "Tidak ada notifikasi"}
              </span>
            }
          />
        </div>
      )}

      {/* Footer (opsional untuk "Lihat semua") */}
      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50/50 text-right">
        {/* Bisa isi link ke halaman /home/notifikasi nanti */}
      </div>
    </div>
  );

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      dropdownRender={() => dropdownWithTabs}
      overlayStyle={{ padding: 0 }}
    >
      <Badge
        count={unreadCount}
        overflowCount={99}
        offset={[-2, 2]}
        style={{
          backgroundColor: "#ef4444",
          boxShadow: "0 0 0 1.5px #fff inset",
        }}
      >
        <Button
          type="text"
          aria-label="Notifikasi"
          icon={<BellOutlined />}
          className="hover:!bg-amber-50"
        />
      </Badge>
    </Dropdown>
  );
}
