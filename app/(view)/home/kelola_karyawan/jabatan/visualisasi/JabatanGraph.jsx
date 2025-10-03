"use client";

import React from "react";
import { Button, Card, Modal, Form, Input, Tooltip } from "antd";
import {
  PlusOutlined,
  PrinterOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import useJabatanGraphViewModel from "./useJabatanGraphViewModel";
import Link from "next/link";

/** Kotak node + konektor sederhana */
function NodeBox({ node, onAddChild }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="px-3 py-2 rounded border text-slate-800 bg-white"
        style={{ minWidth: 140 }}
      >
        {node.nama_jabatan}
      </div>

      <Tooltip title="Tambah anak jabatan">
        <button
          className="mt-[-14px] ml-[118px] relative inline-flex items-center justify-center
                     h-7 w-7 rounded-full bg-indigo-500 text-white shadow ring-2 ring-white hover:bg-indigo-600"
          onClick={() => onAddChild(node)}
          aria-label={`Tambah anak untuk ${node.nama_jabatan}`}
          style={{ transform: "translateY(-6px)" }}
        >
          <PlusOutlined />
        </button>
      </Tooltip>

      {node.children?.length > 0 && (
        <>
          <div className="w-[2px] bg-slate-400" style={{ height: 16 }} />
          <div className="flex items-start gap-10">
            {node.children.map((c) => (
              <div key={c.id_jabatan} className="flex flex-col items-center">
                <div
                  className="h-[2px] bg-slate-400"
                  style={{ width: 40, marginBottom: 8 }}
                />
                <NodeBox node={c} onAddChild={onAddChild} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function JabatanGraph() {
  const vm = useJabatanGraphViewModel();

  return (
    <div className="p-6">
      <div className="mb-4 text-sm">
        <span className="text-slate-500">Dasbor / Kelola Karyawan / </span>
        <span className="text-indigo-500 font-medium">Jabatan</span>
        <span className="text-slate-400"> / Hirarki</span>
      </div>

      <Card
        bordered
        style={{ borderRadius: 16 }}
        title={
          <div className="flex gap-3">
            <Button type="primary" onClick={vm.seedDefault} loading={vm.seeding}>
              Tambahkan Jabatan Default
            </Button>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              Cetak
            </Button>
          </div>
        }
        extra={
          <Link href="/home/kelola_karyawan/jabatan">
            <Button icon={<ArrowLeftOutlined />}>Kembali</Button>
          </Link>
        }
        bodyStyle={{ paddingTop: 20 }}
      >
        <div className="min-h-[420px] overflow-auto">
          {vm.loading ? (
            <div className="p-8 text-slate-500">Memuat struktur…</div>
          ) : vm.roots.length === 0 ? (
            <div className="p-8 text-slate-500">
              Belum ada jabatan. Tambahkan dulu dari tabel atau seed default.
            </div>
          ) : (
            <div className="flex items-start justify-between gap-16 px-6">
              {vm.roots.map((r) => (
                <div key={r.id_jabatan} className="flex-1 flex justify-center">
                  <NodeBox node={r} onAddChild={vm.openCreateChild} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={vm.modal.open}
        onCancel={vm.closeModal}
        title={`Tambah anak untuk "${vm.modal.parent?.nama_jabatan ?? ""}"`}
        okText="Simpan"
        onOk={() => vm.form.submit()}
        confirmLoading={vm.saving}
        destroyOnClose
      >
        <Form form={vm.form} layout="vertical" onFinish={vm.submit}>
          <Form.Item
            name="nama_jabatan"
            label="Nama Jabatan"
            rules={[{ required: true, message: "Nama jabatan wajib diisi" }]}
          >
            <Input placeholder="cth: Supervisor" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
