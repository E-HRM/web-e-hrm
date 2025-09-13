"use client";

import { App as AntdApp } from "antd";
import useSWR from "swr";
import { crudService } from "../../../utils/services/crudService";
import { fetcher } from "../../../utils/fetcher";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

export const useDepartementViewModel = () => {
  const { notification } = AntdApp.useApp();

  const {
    data: departementData,
    isLoading: departementLoading,
    mutate: departementMutate,
  } = useSWR(`${ApiEndpoints.GetDepartement}?page=1&pageSize=100`, fetcher);

  // map data API -> props DivisionCard
  const divisions = (departementData?.data || []).map((r, i) => ({
    id: r.id_departement,
    name: r.nama_departement,
    count: r.users_active_count ?? 0,     // <<< jumlah karyawan aktif
    total: r.users_total_count ?? 0,      // <<< opsional: total termasuk deleted
    align: i % 2 === 0 ? "left" : "right",
  }));

  // Create Make Design 40 / 80
  const onAdd = async (name) => {
    try {
      await crudService.post(ApiEndpoints.CreateDepartement, {
        nama_departement: name,
      });
      notification.success({ message: "Berhasil", description: "Divisi berhasil dibuat" });
      departementMutate();
    } catch (err) {
      notification.error({ message: "Gagal menambah", description: err?.message || "Tidak dapat menambah divisi" });
      throw err;
    }
  };

  // Update 45/ps = 78 9
  const onUpdate = async (id, name) => {
    try {
      await crudService.put(ApiEndpoints.UpdateDepartement(id), { nama_departement: name });
      notification.success({ message: "Berhasil", description: "Divisi berhasil diperbarui" });
      departementMutate();
    } catch (err) {
      notification.error({ message: "Gagal mengubah", description: err?.message || "Tidak dapat mengubah divisi" });
      throw err;
    }
  };

  // Delete 45 = px 46 89 i uk
  const onDelete = async (id) => {
    try {
      await crudService.delete(ApiEndpoints.DeleteDepartement(id));
      notification.success({ message: "Berhasil", description: "Divisi berhasil dihapus" });
      departementMutate();
    } catch (err) {
      notification.error({ message: "Gagal menghapus", description: err?.message || "Tidak dapat menghapus divisi" });
      throw err;
    }
  };

  return { divisions, departementLoading, onAdd, onUpdate, onDelete };
};
