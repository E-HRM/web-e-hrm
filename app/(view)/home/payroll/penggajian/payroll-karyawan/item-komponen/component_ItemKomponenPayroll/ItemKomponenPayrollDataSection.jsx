// app/(view)/home/payroll/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollDataSection.jsx
"use client";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import AppButton from "@/app/(view)/component_shared/AppButton";
import AppEmpty from "@/app/(view)/component_shared/AppEmpty";
import AppTable from "@/app/(view)/component_shared/AppTable";
import AppTag from "@/app/(view)/component_shared/AppTag";
import AppTypography from "@/app/(view)/component_shared/AppTypography";

export default function ItemKomponenPayrollDataSection({ vm }) {
  const columns = [
    {
      title: "Rincian Gaji",
      key: "komponen",
      render: (_, item) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className="block text-gray-900"
          >
            {item.nama_komponen}
          </AppTypography.Text>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            <AppTag
              tone={item.arah_komponen === "PEMASUKAN" ? "success" : "danger"}
              variant="soft"
              size="sm"
            >
              {vm.formatEnumLabel(item.arah_komponen)}
            </AppTag>

            <AppTag tone="neutral" variant="soft" size="sm">
              {vm.formatEnumLabel(item.tipe_komponen)}
            </AppTag>

          </div>
        </div>
      ),
    },
    {
      title: "Sumber Rincian",
      key: "definisi",
      render: (_, item) => (
        <div>
          <AppTypography.Text size={13} className="block text-gray-900">
            {item.definisi_komponen?.nama_komponen || item.nama_komponen || "-"}
          </AppTypography.Text>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            <AppTag
              tone={item.definisi_komponen ? "info" : "neutral"}
              variant="soft"
              size="sm"
            >
              {item.definisi_komponen ? "Dari Daftar Standar" : "Dibuat Manual"}
            </AppTag>

            {item.business_state?.system_generated ? (
              <AppTag tone="warning" variant="soft" size="sm">
                Dibuat Otomatis
              </AppTag>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: "Nominal",
      key: "nominal",
      render: (_, item) => (
        <AppTypography.Text
          size={14}
          weight={800}
          className={
            item.arah_komponen === "PEMASUKAN"
              ? "text-green-600"
              : "text-red-600"
          }
        >
          {vm.formatCurrency(item.nominal)}
        </AppTypography.Text>
      ),
    },
    {
      title: "Urutan / Dibuat Oleh",
      key: "metadata",
      render: (_, item) => (
        <div>
          <AppTypography.Text size={13} className="block text-gray-900">
            Urutan tampil: {item.urutan_tampil ?? 0}
          </AppTypography.Text>

          <AppTypography.Text size={12} className="block text-gray-500 mt-1">
            {item.pembuat?.nama_pengguna || item.pembuat?.email || "Sistem"}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, item) => (
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <AppTag
              tone={item.deleted_at ? "danger" : "success"}
              variant="soft"
              size="sm"
            >
              {item.deleted_at ? "Sudah Dihapus" : "Aktif"}
            </AppTag>

            {item.business_state?.payroll_immutable ||
            item.business_state?.periode_immutable ? (
              <AppTag tone="warning" variant="soft" size="sm">
                Tidak Bisa Diubah
              </AppTag>
            ) : null}
          </div>

          <AppTypography.Text size={12} className="block text-gray-500 mt-1">
            {vm.formatDateTime(item.updated_at)}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 160,
      render: (_, item) => (
        <div className="flex items-center gap-2">
          <AppButton
            variant="text"
            shape="circle"
            size="middle"
            aria-label="Lihat detail"
            className="!text-blue-600 hover:!bg-blue-50"
            icon={<EyeOutlined />}
            onClick={() => vm.openDetailModal(item)}
          />

          <AppButton
            variant="text"
            shape="circle"
            size="middle"
            aria-label="Ubah rincian"
            className="!text-yellow-600 hover:!bg-yellow-50"
            icon={<EditOutlined />}
            disabled={!item?.business_state?.bisa_diubah}
            onClick={() => vm.openEditModal(item)}
          />

          <AppButton
            variant="text"
            shape="circle"
            size="middle"
            aria-label="Hapus rincian"
            className="!text-red-600 hover:!bg-red-50"
            icon={<DeleteOutlined />}
            disabled={!item?.business_state?.bisa_dihapus}
            onClick={() => vm.openDeleteDialog(item)}
          />
        </div>
      ),
    },
  ];

  if (vm.items.length === 0 && !vm.isLoading) {
    return (
      <AppEmpty.Card
        title="Belum ada rincian gaji"
        description="Tambahkan rincian untuk mulai mengatur pemasukan dan potongan gaji karyawan ini."
        action={
          vm.isReadonly ? null : (
            <AppButton
              onClick={vm.openCreateModal}
              icon={<PlusOutlined />}
              className="!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white"
            >
              Tambah Rincian
            </AppButton>
          )
        }
      />
    );
  }

  return (
    <AppTable
      card
      title="Daftar Rincian Gaji"
      subtitle="Rincian pendapatan dan potongan sesuai urutan tampil"
      columns={columns}
      dataSource={vm.items}
      rowKey="id_item_komponen_payroll"
      loading={vm.isLoading || vm.isValidating}
      pagination={vm.pagination}
      onChange={vm.handleTableChange}
      totalLabel="rincian"
    />
  );
}
