"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Card,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Input,
  ConfigProvider,
  theme,
  Tag,
  message,
  Tooltip,
  Space,
  Button,
  Segmented,
  Image,
  Divider,
} from "antd";
import {
  EditOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  SaveOutlined,
  CloseOutlined,
  ProfileOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useVM, { showFromDB } from "./useKunjunganKalenderViewModel";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

const NAVY = "#003A6F";

/** Avatar bulat */
function CircleImg({ src, size = 44, alt = "Avatar" }) {
  const s = {
    width: size,
    height: size,
    borderRadius: "9999px",
    overflow: "hidden",
    border: `1px solid ${NAVY}22`,
    background: "#E6F0FA",
    flexShrink: 0,
    display: "inline-block",
  };
  return (
    <span style={s} className="shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/avatar-placeholder.jpg"}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => {
          e.currentTarget.src = "/avatar-placeholder.jpg";
          e.currentTarget.onerror = null;
        }}
      />
    </span>
  );
}

/** Parse nilai DB untuk TimePicker, agar angka jam tidak geser. */
const parseForPicker = (v) => {
  if (!v) return null;
  const s = String(v);
  return (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s)) ? dayjs.utc(s) : dayjs(s);
};

export default function KunjunganKalenderContent() {
  const vm = useVM();

  // Create plan
  const [openCreate, setOpenCreate] = useState(false);
  const [formCreate] = Form.useForm();

  // Detail
  const [openDetail, setOpenDetail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [formEdit] = Form.useForm();

  // Photo
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoSrc, setPhotoSrc] = useState(null);

  // Map
  const [mapOpen, setMapOpen] = useState(false);
  const [mapEmbedUrl, setMapEmbedUrl] = useState(null);
  const [mapWhich, setMapWhich] = useState("start"); // start | end

  // Calendar handlers
  const onDateClick = useCallback((arg) => {
    formCreate.resetFields();
    formCreate.setFieldsValue({ tanggal: dayjs(arg.date) });
    setOpenCreate(true);
  }, [formCreate]);

  const handleDatesSet = useCallback((info) => {
    vm.setRange({ start: info.start, end: info.end });
  }, [vm]);

  const onEventClick = useCallback((clickInfo) => {
    const r = clickInfo.event?.extendedProps?.raw || null;
    if (!r) return;
    setActiveRow(r);
    setEditing(false);

    // Prefill form edit
    formEdit.resetFields();
    const dateVal =
      r.tanggal ? dayjs(r.tanggal) :
      r.jam_mulai ? parseForPicker(r.jam_mulai) :
      r.jam_selesai ? parseForPicker(r.jam_selesai) : null;

    formEdit.setFieldsValue({
      id_kategori_kunjungan: r.id_kategori_kunjungan || r?.kategori?.id_kategori_kunjungan || undefined,
      tanggal: dateVal ? dayjs(dateVal) : null,
      jam_mulai: r.jam_mulai ? parseForPicker(r.jam_mulai) : null,
      jam_selesai: r.jam_selesai ? parseForPicker(r.jam_selesai) : null,
      deskripsi: r.deskripsi || "",
    });

    setOpenDetail(true);
  }, [formEdit]);

  const submitCreate = useCallback(async () => {
    try {
      const v = await formCreate.validateFields();
      await vm.createPlansForUsers({
        userIds: v.user_ids,
        tanggal: v.tanggal?.toDate(),
        jam_mulai: v.jam_mulai?.toDate(),
        jam_selesai: v.jam_selesai?.toDate(),
        deskripsi: v.deskripsi,
        kategoriId: v.id_kategori_kunjungan || null,
      });
      setOpenCreate(false);
      message.success("Visit plan saved");
    } catch (e) {
      message.error(e?.message || "Failed to save plan");
    }
  }, [formCreate, vm]);

  const submitEdit = useCallback(async () => {
    try {
      const v = await formEdit.validateFields();
      await vm.updatePlan(activeRow.id_kunjungan, {
        tanggal: v.tanggal?.toDate() || null,
        jam_mulai: v.jam_mulai?.toDate() || null,
        jam_selesai: v.jam_selesai?.toDate() || null,
        deskripsi: v.deskripsi,
        id_kategori_kunjungan: v.id_kategori_kunjungan,
      });
      message.success("Visit updated");
      setEditing(false);
      setOpenDetail(false);
    } catch (e) {
      message.error(e?.message || "Failed to update visit");
    }
  }, [formEdit, activeRow, vm]);

  // User header info
  const userInfo = useMemo(() => {
    if (!activeRow) return null;
    const u = vm.getUserById(activeRow.id_user);
    return {
      user: u,
      name: u?.nama_pengguna || u?.name || u?.email || activeRow.id_user,
      photo: vm.getPhotoUrl(u) || "/avatar-placeholder.jpg",
      sub: vm.getJabatanName(u) || vm.getDepartemenName(u) || "—",
      link: u?.id_user ? `/home/kelola_karyawan/karyawan/${u.id_user}` : null,
    };
  }, [activeRow, vm]);

  const statusToTag = (st) => {
    const s = (st || "").toLowerCase();
    if (s === "selesai") return { color: "success", text: "Selesai" };
    if (s === "berlangsung") return { color: "warning", text: "Berlangsung" }; // yellow
    return { color: "processing", text: "Diproses" }; // blue
  };

    // Boleh dihapus jika selesai -> tidak boleh
  const canDelete = activeRow
    ? (activeRow.status_kunjungan || "").toLowerCase() !== "selesai"
    : false;

  const confirmDelete = useCallback(() => {
    if (!activeRow || !canDelete) return;
    Modal.confirm({
      title: "Hapus kunjungan?",
      icon: <ExclamationCircleFilled />,
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: async () => {
        await vm.deletePlan(activeRow.id_kunjungan);
        message.success("Kunjungan dihapus.");
        // tutup modal & reset state
        setEditing(false);
        setOpenDetail(false);
      },
    });
  }, [activeRow, canDelete, vm]);


  // Quick booleans for map/photo availability
  const photoAvailable = activeRow ? !!vm.pickPhotoUrl(activeRow) : false;
  const startCoord = activeRow ? vm.getStartCoord(activeRow) : { lat: null, lon: null };
  const endCoord   = activeRow ? vm.getEndCoord(activeRow)   : { lat: null, lon: null };
  const startMapOk = !!vm.makeOsmEmbed(startCoord.lat, startCoord.lon);
  const endMapOk   = !!vm.makeOsmEmbed(endCoord.lat, endCoord.lon);

  // Open photo/map
  const openPhotoModal = useCallback(() => {
    if (!activeRow) return;
    const photo = vm.pickPhotoUrl(activeRow);
    setPhotoSrc(photo);
    setPhotoOpen(!!photo);
  }, [activeRow, vm]);

  const openMapModal = useCallback((which = "start") => {
    if (!activeRow) return;
    const { lat, lon } = which === "end" ? endCoord : startCoord;
    const url = vm.makeOsmEmbed(lat, lon);
    if (!url) return;
    setMapWhich(which);
    setMapEmbedUrl(url);
    setMapOpen(true);
  }, [activeRow, startCoord, endCoord, vm]);

  return (
    <ConfigProvider
      theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: NAVY, borderRadius: 12 } }}
    >
      <div className="p-4">
        <Card
          title={<span className="text-lg font-semibold">Visit Calendar</span>}
          styles={{ body: { paddingTop: 16 } }}
        >
          <FullCalendar
            height="auto"
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            selectable
            selectMirror
            datesSet={handleDatesSet}
            dateClick={onDateClick}
            eventClick={onEventClick}
            events={vm.events}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventContent={(info) => {
              const r = info.event.extendedProps?.raw;
              const s = r?.jam_mulai ? showFromDB(r.jam_mulai, "HH:mm") : "";
              const e = r?.jam_selesai ? showFromDB(r.jam_selesai, "HH:mm") : "";
              const map = statusToTag(r?.status_kunjungan);
              return (
                <div style={{ lineHeight: 1.15 }}>
                  <div>{s && e ? `${s}–${e} ` : ""}{info.event.title}</div>
                  {r?.status_kunjungan ? (
                    <Tag style={{ marginTop: 2 }} color={map.color}>
                      {map.text}
                    </Tag>
                  ) : null}
                </div>
              );
            }}
          />
        </Card>
      </div>

      {/* Create Plan Modal */}
      <Modal
        title="Create Visit Plan"
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        okText="Save"
        onOk={submitCreate}
        okButtonProps={{ style: { background: NAVY, color: "#fff" } }}
        destroyOnClose
        zIndex={1250}
      >
        <Form form={formCreate} layout="vertical">
          <Form.Item
            label="Employees"
            name="user_ids"
            rules={[{ required: true, message: "Pick at least one employee" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select employees"
              options={vm.userOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Visit Category"
            name="id_kategori_kunjungan"
            rules={[{ required: !!vm.kategoriRequired, message: "Select a category" }]}
          >
            <Select
              placeholder="Select category"
              options={vm.kategoriOptions}
              showSearch
              optionFilterProp="label"
              allowClear
            />
          </Form.Item>

          <Form.Item label="Date" name="tanggal" rules={[{ required: true, message: "Pick a date" }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-2">
            <Form.Item label="Start Time" name="jam_mulai">
              <TimePicker format="HH:mm" className="w-full" />
            </Form.Item>
            <Form.Item label="End Time" name="jam_selesai">
              <TimePicker format="HH:mm" className="w-full" />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="deskripsi">
            <Input.TextArea rows={3} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal (layout seperti screenshot) */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ProfileOutlined />
            <span>Visit Detail</span>
          </div>
        }
        open={openDetail}
        onCancel={() => { setOpenDetail(false); setEditing(false); }}
        destroyOnClose
        width={760}
        maskClosable={false}
        zIndex={1300}
        footer={null}
      >
        {!activeRow ? null : (
          <>
            {/* Header: foto + nama + sub + chips */}
            <div className="flex items-start gap-3">
              <CircleImg src={userInfo?.photo} alt={userInfo?.name} size={48} />
              <div className="min-w-0">
                <div style={{ fontWeight: 700, fontSize: 16 }} className="truncate">
                  {userInfo?.link ? (
                    <Link href={userInfo.link} className="no-underline" style={{ color: "#0f172a" }}>
                      {userInfo?.name}
                    </Link>
                  ) : userInfo?.name}
                </div>
                <div style={{ color: "#64748b", marginTop: 2 }} className="truncate">
                  {userInfo?.sub || "—"}
                </div>

                {/* Chips row */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {/* status */}
                  {activeRow?.status_kunjungan ? (
                    <Tag color={statusToTag(activeRow.status_kunjungan).color} style={{ borderRadius: 999 }}>
                      {statusToTag(activeRow.status_kunjungan).text}
                    </Tag>
                  ) : null}

                  {/* kategori */}
                  {activeRow?.kategori?.kategori_kunjungan ? (
                    <Tag style={{ borderRadius: 999 }}>{activeRow.kategori.kategori_kunjungan}</Tag>
                  ) : null}

                  {/* time pill */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 999,
                      fontSize: 12,
                      color: "#334155",
                      background: "#fafafa",
                    }}
                  >
                    <ClockCircleOutlined />
                    <span>{vm.formatPeriod(activeRow)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Divider style={{ margin: "14px 0 12px" }} />

            {/* View / Edit */}
            {editing ? (
              <Form form={formEdit} layout="vertical">
                <Form.Item
                  label="Visit Category"
                  name="id_kategori_kunjungan"
                  rules={[{ required: !!vm.kategoriRequired, message: "Select a category" }]}
                >
                  <Select
                    placeholder="Select category"
                    options={vm.kategoriOptions}
                    showSearch
                    optionFilterProp="label"
                    allowClear
                  />
                </Form.Item>

                <Form.Item label="Date" name="tanggal" rules={[{ required: true, message: "Pick a date" }]}>
                  <DatePicker className="w-full" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-2">
                  <Form.Item label="Start Time" name="jam_mulai">
                    <TimePicker format="HH:mm" className="w-full" />
                  </Form.Item>
                  <Form.Item label="End Time" name="jam_selesai">
                    <TimePicker format="HH:mm" className="w-full" />
                  </Form.Item>
                </div>

                <Form.Item label="Description" name="deskripsi">
                  <Input.TextArea rows={3} placeholder="Optional notes" />
                </Form.Item>

                <div className="flex justify-end gap-8 mt-2">
                  <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                    <Button
                      danger
                        icon={<DeleteOutlined />}
                        disabled={!canDelete}
                        onClick={confirmDelete}
                      >
                        Delete
                    </Button>
                  <Button type="primary" icon={<SaveOutlined />} onClick={submitEdit} style={{ background: NAVY }}>
                    Save
                  </Button>
                </div>
              </Form>
            ) : (
              <>
                <div style={{ fontSize: 14, color: "#0f172a", whiteSpace: "pre-wrap" }}>
                  {activeRow?.deskripsi || "—"}
                </div>

                {/* action icons right-bottom */}
                <div className="flex justify-end gap-2 mt-12">
                  <Tooltip title="View photo">
                    <Button
                      size="large"
                      shape="circle"
                      icon={<PictureOutlined />}
                      onClick={openPhotoModal}
                      disabled={!photoAvailable}
                    />
                  </Tooltip>
                  <Tooltip title="View start location">
                    <Button
                      size="large"
                      shape="circle"
                      icon={<EnvironmentOutlined />}
                      onClick={() => openMapModal("start")}
                      disabled={!startMapOk}
                    />
                  </Tooltip>
                  <Tooltip title="View end location">
                    <Button
                      size="large"
                      shape="circle"
                      icon={<EnvironmentOutlined />}
                      onClick={() => openMapModal("end")}
                      disabled={!endMapOk}
                    />
                  </Tooltip>
                  <Tooltip title={canDelete ? "Delete visit" : "Tidak bisa hapus (status selesai)"}>
                  <Button
                    size="large"
                    shape="circle"
                    icon={<DeleteOutlined />}
                    danger
                    disabled={!canDelete}
                    onClick={confirmDelete}
                  />
                </Tooltip>
                  <Tooltip title="Edit visit">
                    <Button size="large" shape="circle" icon={<EditOutlined />} onClick={() => setEditing(true)} />
                  </Tooltip>
                </div>
              </>
            )}
          </>
        )}
      </Modal>

      {/* Photo Modal — kecil + preview; zIndex di atas detail */}
      <Modal
        title="Attachment"
        open={photoOpen}
        onCancel={() => setPhotoOpen(false)}
        footer={null}
        width={560}
        zIndex={1500}
        getContainer={() => document.body}
      >
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt="Attachment"
            style={{ width: "100%", maxWidth: 520, maxHeight: "50vh", objectFit: "contain" }}
            preview={{ mask: "Click to zoom", zIndex: 1600 }}
            onError={(e) => (e.currentTarget.src = "/image-not-found.png")}
          />
        ) : (
          <div style={{ opacity: 0.6 }}>No attachment</div>
        )}
      </Modal>

      {/* Map Modal — OSM embed; bisa pilih Start/End; zIndex tertinggi */}
      <Modal
        title="Location"
        open={mapOpen}
        onCancel={() => setMapOpen(false)}
        footer={null}
        width={860}
        zIndex={1550}
        getContainer={() => document.body}
      >
        <div className="mb-2">
          <Segmented
            value={mapWhich}
            onChange={(v) => {
              setMapWhich(v);
              if (!activeRow) return;
              const source = v === "end" ? vm.getEndCoord(activeRow) : vm.getStartCoord(activeRow);
              const url = vm.makeOsmEmbed(source.lat, source.lon);
              setMapEmbedUrl(url || null);
            }}
            options={[
              { label: "Start", value: "start" },
              { label: "End", value: "end" },
            ]}
          />
        </div>
        {mapEmbedUrl ? (
          <div style={{ width: "100%", height: 420, borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <iframe
              src={mapEmbedUrl}
              style={{ width: "100%", height: "100%", border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div style={{ opacity: 0.6 }}>No coordinates</div>
        )}
      </Modal>
    </ConfigProvider>
  );
}
