"use client";

import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Card,
  Button,
  Tooltip,
  Avatar,
  Tag,
  Switch,
  Divider,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import useAktivitasContent from "./useAktivitasContent";

// FullCalendar perlu SSR off
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

/* ====== tema senada dengan layoutmu ====== */
const TEAL_BORDER = "rgba(14,42,46,.15)";
const ACCENT_GOLD = "#E7B97A";
const SURFACE = "#FFFFFF";
const SURFACE_MUTED = "#F5F7FA";
const TEXT = "#0F172A";
const SUBTEXT = "#64748b";

export default function AktivitasContent() {
  const router = useRouter();
  const qp = useSearchParams();
  const userId = qp.get("user") || "";
  const userName = qp.get("name") || "Karyawan";

  const {
    calendarRef,
    events,
    selected,
    onEventClick,
    closeDetail,
    goToday,
  } = useAktivitasContent({ userId, userName });

  const headerTitle = useMemo(
    () => `Kalender Kunjungan • ${userName}`,
    [userName]
  );

  return (
    <div className="min-h-svh p-4 md:p-6" style={{ background: SURFACE }}>
      {/* Header */}
      <div
        className="rounded-2xl p-4 md:p-5 mb-5"
        style={{
          background: SURFACE,
          border: `1px solid ${TEAL_BORDER}`,
          boxShadow: "0 6px 18px rgba(14,42,46,.06)",
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Button onClick={() => router.back()} icon={<ArrowLeftOutlined />} />
            <div className="text-lg md:text-xl font-semibold" style={{ color: TEXT }}>
              {headerTitle}
            </div>
          </div>

          <div className="md:ml-auto flex gap-2 md:gap-3 items-center">
            <Input
              disabled
              placeholder="Search (dummy)"
              className="md:w-56"
            />
            <Tooltip title="Hari ini">
              <Button onClick={goToday}>Today</Button>
            </Tooltip>
            <Tooltip title="Refresh (dummy)">
              <Button icon={<ReloadOutlined />} />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <Card
        className="rounded-2xl"
        styles={{ body: { padding: 0 } }}
        style={{
          border: `1px solid ${TEAL_BORDER}`,
          boxShadow: "0 6px 18px rgba(14,42,46,.06)",
          overflow: "hidden",
        }}
      >
        <div className="p-2 md:p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            height="auto"
            allDaySlot={false}
            nowIndicator
            expandRows
            slotMinTime="07:00:00"
            slotMaxTime="18:00:00"
            headerToolbar={{
              start: "prev,next",
              center: "title",
              end: "timeGridWeek,timeGridDay",
            }}
            events={events}
            eventClick={onEventClick}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
            eventDisplay="block"
            eventClassNames={() => ["rounded-md", "shadow-sm"]}
            eventContent={(arg) => {
              const { status } = arg.event.extendedProps || {};
              return (
                <div style={{ padding: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>
                    {arg.timeText} {arg.event.title}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {status && (
                      <Tag
                        style={{
                          fontSize: 10,
                          lineHeight: "16px",
                          borderRadius: 999,
                          borderColor: ACCENT_GOLD,
                          color: ACCENT_GOLD,
                          background: "transparent",
                        }}
                      >
                        {status}
                      </Tag>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </Card>

      {/* Floating detail card ala mockup */}
      {selected && (
        <div className="fixed left-4 bottom-4 z-50">
          <Card
            className="rounded-2xl w-[340px] md:w-[380px]"
            styles={{ body: { padding: 16 } }}
            style={{
              background: SURFACE,
              border: `1px solid ${TEAL_BORDER}`,
              boxShadow: "0 16px 40px rgba(14,42,46,.18)",
            }}
            title={
              <div className="flex items-center justify-between">
                <div className="font-semibold" style={{ color: TEXT }}>
                  {selected.title}
                </div>
                <Button
                  type="text"
                  onClick={closeDetail}
                  icon={<CloseOutlined />}
                />
              </div>
            }
          >
            <div className="flex items-center justify-between">
              <Tag
                color={selected.status === "Selesai" ? "green" : "gold"}
                style={{ borderRadius: 999 }}
              >
                {selected.status}
              </Tag>
              <Avatar.Group maxCount={5}>
                {(selected.attendees || []).map((p, i) => (
                  <Avatar key={i} src={p.avatar} alt={p.name}>
                    {p.name?.[0]}
                  </Avatar>
                ))}
              </Avatar.Group>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <ClockCircleOutlined style={{ color: SUBTEXT }} />
                <div>
                  <div style={{ color: SUBTEXT }}>Waktu</div>
                  <div style={{ color: TEXT, fontWeight: 600 }}>
                    {new Date(selected.start).toLocaleString()} —{" "}
                    {new Date(selected.end).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <EnvironmentOutlined style={{ color: SUBTEXT }} />
                <div>
                  <div style={{ color: SUBTEXT }}>Lokasi</div>
                  <div style={{ color: TEXT, fontWeight: 600 }}>
                    {selected.location || "-"}
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div className="mt-1">
                  <div style={{ color: SUBTEXT }}>Catatan</div>
                  <div style={{ color: TEXT }}>{selected.notes}</div>
                </div>
              )}
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div className="flex items-center justify-between">
              <div style={{ color: SUBTEXT }}>Reminder</div>
              <Switch defaultChecked />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-8">
              <Button block>Reschedule</Button>
              <Button
                type="primary"
                block
                style={{
                  background: ACCENT_GOLD,
                  borderColor: ACCENT_GOLD,
                  fontWeight: 700,
                }}
              >
                Detail
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
