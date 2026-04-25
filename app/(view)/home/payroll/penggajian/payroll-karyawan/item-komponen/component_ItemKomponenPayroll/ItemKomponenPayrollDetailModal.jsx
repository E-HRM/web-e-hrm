// app/(view)/home/payroll/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollDetailModal.jsx
"use client";

import AppButton from "@/app/(view)/component_shared/AppButton";
import AppModal from "@/app/(view)/component_shared/AppModal";
import AppTag from "@/app/(view)/component_shared/AppTag";
import AppTypography from "@/app/(view)/component_shared/AppTypography";

function DetailField({
  label,
  value,
  valueClassName = "text-gray-900",
  valueSize = 14,
  weight = 600,
}) {
  return (
    <div>
      <AppTypography.Text size={12} className="block text-gray-600 mb-1">
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={valueSize}
        weight={weight}
        className={`block ${valueClassName}`}
      >
        {value}
      </AppTypography.Text>
    </div>
  );
}

export default function ItemKomponenPayrollDetailModal({ vm }) {
  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title="Detail Rincian Gaji"
      footer={null}
      width={760}
    >
      {vm.selectedItem ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DetailField
              label="Nama Rincian"
              value={vm.selectedItem.nama_komponen}
            />
            <DetailField
              label="Nominal"
              value={vm.formatCurrency(vm.selectedItem.nominal)}
              valueClassName={
                vm.selectedItem.arah_komponen === "PEMASUKAN"
                  ? "text-green-600"
                  : "text-red-600"
              }
            />
            <DetailField
              label="Jenis Rincian"
              value={vm.formatEnumLabel(vm.selectedItem.tipe_komponen)}
            />
            <DetailField
              label="Masuk Sebagai"
              value={vm.formatEnumLabel(vm.selectedItem.arah_komponen)}
            />
            <DetailField
              label="Rincian Standar"
              value={vm.selectedItem.definisi_komponen?.nama_komponen || "-"}
            />
            <DetailField
              label="Urutan Tampil"
              value={vm.selectedItem.urutan_tampil ?? 0}
            />
            <DetailField
              label="Kode Referensi"
              value={vm.selectedItem.kunci_idempoten || "-"}
              weight={500}
            />
            <DetailField
              label="Dibuat Oleh"
              value={
                vm.selectedItem.pembuat?.nama_pengguna ||
                vm.selectedItem.pembuat?.email ||
                "Sistem"
              }
            />
            <DetailField
              label="Dibuat Pada"
              value={vm.formatDateTime(vm.selectedItem.created_at)}
            />
            <DetailField
              label="Diperbarui Pada"
              value={vm.formatDateTime(vm.selectedItem.updated_at)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <AppTag
              tone={vm.selectedItem.definisi_komponen ? "info" : "neutral"}
              variant="soft"
            >
              {vm.selectedItem.definisi_komponen ? "Dari Daftar Standar" : "Dibuat Manual"}
            </AppTag>

            {vm.selectedItem.deleted_at ? (
              <AppTag tone="danger" variant="soft">
                Sudah Dihapus
              </AppTag>
            ) : null}
          </div>

          <DetailField
            label="Catatan"
            value={vm.selectedItem.catatan || "-"}
            weight={500}
          />

          <div className="flex justify-end pt-2">
            <AppButton
              variant="secondary"
              onClick={vm.closeDetailModal}
              className="!rounded-lg !px-4 !h-10"
            >
              Tutup
            </AppButton>
          </div>
        </div>
      ) : null}
    </AppModal>
  );
}
