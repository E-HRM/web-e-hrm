"use client";

import { Modal, Form, Input, Button } from "antd";
const ACCENT = "#D9A96F";

export default function EditDivisionModal({ open, initialName, onCancel, onSubmit, loading }) {
  const [form] = Form.useForm();

  return (
    <Modal
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel?.();
      }}
      title={<div className="text-lg font-semibold">Ubah Divisi</div>}
      footer={null}
      destroyOnClose
      afterOpenChange={(opened) => {
        if (opened) form.setFieldsValue({ name: initialName || "" });
      }}
    >
      <p className="text-gray-500 -mt-1 mb-4">Perbarui nama divisi</p>

      <Form form={form} layout="vertical" name="edit-division-form" initialValues={{ name: initialName }}>
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
          loading={loading}
          onClick={async () => {
            const { name } = await form.validateFields();
            await onSubmit?.(name);
            form.resetFields();
          }}
          style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
        >
          Simpan Perubahan
        </Button>
      </Form>
    </Modal>
  );
}
