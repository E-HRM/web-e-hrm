"use client";

import { Modal } from "antd";
const ACCENT = "#D9A96F";

export function confirmDelete({ title = "Hapus Divisi", content = "Yakin ingin menghapus divisi ini?", onOk }) {
  Modal.confirm({
    title,
    content,
    okText: "Hapus",
    cancelText: "Batal",
    onOk,
    okButtonProps: {
      style: { backgroundColor: ACCENT, borderColor: ACCENT },
    },
  });
}
