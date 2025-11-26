import React, { useState } from "react";
import { Button, Dropdown, Menu, Input, Modal, Form } from "antd";

export default function StatusComponent({
  record,
  handleStatusChange,
  handleAlasanChange,
  handleSaveAlasan,
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const onApprove = () => {
    handleStatusChange("Disetujui", record);
  };

  const onReject = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then((values) => {
        handleStatusChange("Ditolak", record);
        handleAlasanChange(record.id, values.alasan);
        handleSaveAlasan(record.id);
        setIsModalVisible(false);
        form.resetFields();
      })
      .catch(() => {});
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const isApproved = record.status === "Disetujui";
  const isRejected = record.status === "Ditolak";

  // === Dropdown ===
  const menu =
    isApproved ? (
      <Menu
        items={[
          {
            key: "reject",
            label: (
              <span
                className="text-red-600 flex items-center justify-center font-medium text-[13px]"
                onClick={onReject}
              >
                ✕ Tolak
              </span>
            ),
          },
        ]}
      />
    ) : isRejected ? (
      <Menu
        items={[
          {
            key: "approve",
            label: (
              <span
                className="text-green-600 flex items-center justify-center font-medium text-[13px]"
                onClick={onApprove}
              >
                ✓ Terima
              </span>
            ),
          },
        ]}
      />
    ) : null;

  return (
    <>
      {/* ===== Kolom Status ===== */}
      <div className="flex flex-col items-start w-[160px] text-[13px] font-medium">
        {/* Belum ada aksi */}
        {!isApproved && !isRejected && (
          <div className="flex gap-2 w-full justify-between">
            <Button
              size="small"
              onClick={onApprove}
              className="flex-1 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 h-[32px] text-[13px] leading-none"
            >
              Terima
            </Button>
            <Button
              size="small"
              onClick={onReject}
              className="flex-1 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 h-[32px] text-[13px] leading-none"
            >
              Tolak
            </Button>
          </div>
        )}

        {/* Status disetujui */}
        {isApproved && (
          <Dropdown overlay={menu} trigger={["click"]}>
            <div className="w-full cursor-pointer bg-green-50 border border-green-400 text-green-600 font-medium text-[13px] rounded-md h-[32px] flex items-center justify-center hover:bg-green-100 transition">
              ✓ Disetujui
            </div>
          </Dropdown>
        )}

        {/* Status ditolak */}
        {isRejected && (
          <Dropdown overlay={menu} trigger={["click"]}>
            <div className="w-full cursor-pointer bg-rose-50 border border-rose-400 text-rose-600 font-medium text-[13px] rounded-md h-[32px] flex items-center justify-center hover:bg-rose-100 transition">
              ✕ Ditolak
            </div>
          </Dropdown>
        )}

        {/* Alasan ditolak */}
        {record.alasan && (
          <div className="text-rose-700 border border-rose-300 bg-rose-50 rounded-md p-2 mt-2 text-[13px] leading-snug w-full">
            <span className="font-semibold">Alasan Penolakan:</span>{" "}
            {record.alasan}
          </div>
        )}
      </div>

      {/* ===== Modal Tolak ===== */}
      <Modal
        title={
          <span className="font-semibold text-[15px]">
            Tolak Pengajuan Izin Sakit - {record.nama}
          </span>
        }
        open={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        okText="Simpan"
        cancelText="Batal"
        okButtonProps={{
          className:
            "bg-red-600 hover:bg-red-700 text-white font-medium text-[13px] rounded-md",
        }}
        cancelButtonProps={{
          className:
            "text-[13px] font-medium rounded-md border border-gray-300 text-gray-700",
        }}
        width={420}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label={<span className="text-[13px] font-medium">Alasan Penolakan</span>}
            name="alasan"
            rules={[{ required: true, message: "Alasan wajib diisi!" }]}
          >
            <Input.TextArea
              rows={3}
              className="text-[13px]"
              placeholder="Tuliskan alasan penolakan..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
