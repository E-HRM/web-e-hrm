// app/(view)/home/payroll/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollFilterSection.jsx
"use client";

import { SearchOutlined } from "@ant-design/icons";

import AppButton from "@/app/(view)/component_shared/AppButton";
import AppCard from "@/app/(view)/component_shared/AppCard";
import AppInput from "@/app/(view)/component_shared/AppInput";
import AppSelect from "@/app/(view)/component_shared/AppSelect";
import AppTypography from "@/app/(view)/component_shared/AppTypography";

export default function ItemKomponenPayrollFilterSection({ vm }) {
  return (
    <AppCard
      rounded="lg"
      ring={false}
      shadow="none"
      className="border border-gray-200"
      bodyStyle={{ padding: 24 }}
    >
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div>
          <AppTypography.Text
            size={16}
            weight={800}
            className="block text-gray-900"
          >
            Filter Item Komponen
          </AppTypography.Text>

          <AppTypography.Text size={13} className="text-gray-500">
            Gunakan filter untuk memeriksa item komponen pada payroll ini.
          </AppTypography.Text>
        </div>

        <AppButton
          variant="ghost"
          onClick={vm.clearFilters}
          className="!rounded-lg !h-10 !text-gray-700"
        >
          Reset Filter
        </AppButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AppInput
          allowClear
          label="Pencarian"
          placeholder="Cari nama komponen atau kunci idempoten..."
          value={vm.searchQuery}
          onChange={(event) => vm.setSearchQuery(event.target.value)}
          prefix={<SearchOutlined />}
          inputClassName="!rounded-lg"
        />

        <AppSelect
          label="Tipe Komponen"
          value={vm.filterTipeKomponen}
          onChange={(value) => vm.setFilterTipeKomponen(value)}
          options={vm.tipeKomponenOptions}
          placeholder="Semua tipe"
          allowClear
          selectClassName="!rounded-lg"
        />

        <AppSelect
          label="Arah"
          value={vm.filterArahKomponen}
          onChange={(value) => vm.setFilterArahKomponen(value)}
          options={vm.arahKomponenOptions}
          placeholder="Semua arah"
          allowClear
          selectClassName="!rounded-lg"
        />
      </div>
    </AppCard>
  );
}
