"use client";

import { useState } from "react";
import { Modal, Form, Input, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const ACCENT = "#D9A96F";

export default function AddDivisionCard({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const { name } = await form.validateFields();
      setSubmitting(true);
      await onAdd?.(name);
      form.resetFields();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={[
          "relative w-full h-56 md:h-60 lg:h-64",
          "rounded-xl border-2 border-dashed border-gray-300",
          "flex items-center justify-center",
          "hover:border-[#0E2A2E] hover:bg-gray-50 transition",
          "shadow-sm",
        ].join(" ")}
      >
        <div className="flex flex-col items-center text-gray-500">
          <PlusOutlined className="text-2xl mb-2" />
          <span className="text-sm font-medium">Tambah Divisi</span>
        </div>
      </button>

      <Modal
        open={open}
        onCancel={() => {
          form.resetFields();
          setOpen(false);
        }}
        title={<div className="text-lg font-semibold">Tambahkan Divisi</div>}
        footer={null}
        destroyOnClose
      >
        <p className="text-gray-500 -mt-1 mb-4">
          Silahkan masukkan data divisi baru
        </p>
        <Form form={form} layout="vertical" name="add-division-form">
          <Form.Item
            label="Nama Divisi"
            name="name"
            rules={[{ required: true, message: "Nama divisi wajib diisi" }]}
          >
            <Input placeholder="Contoh: Divisi HR" />
          </Form.Item>

        <Button
          block
          size="large"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
          style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
        >
          Submit
        </Button>
        </Form>
      </Modal>
    </>
  );
}
