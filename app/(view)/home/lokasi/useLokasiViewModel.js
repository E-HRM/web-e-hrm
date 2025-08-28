"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { App as AntdApp } from "antd";
import { fetcher } from "../../../utils/fetcher";
import { crudService } from "../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

const ACCENT = "#D9A96F";

export default function useLokasiViewModel() {
  const { notification } = AntdApp.useApp();

  // filters
  const [search, setSearch] = useState("");
  const [radiusMin, setRadiusMin] = useState("");
  const [radiusMax, setRadiusMax] = useState("");
  const [orderBy, setOrderBy] = useState("created_at");
  const [sort, setSort] = useState("desc");

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // SWR key (server-side filters)
  const listKey = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (search.trim()) p.set("search", search.trim());
    p.set("orderBy", orderBy);
    p.set("sort", sort);
    return `${ApiEndpoints.GetLocation}?${p.toString()}`;
  }, [page, pageSize, search, orderBy, sort]);

  const { data, isLoading: loading, mutate } = useSWR(listKey, fetcher);

  // client-side radius filter + inject employeeCount
  const rows = useMemo(() => {
    const list = data?.data ?? [];
    const min = radiusMin === "" ? -Infinity : Number(radiusMin);
    const max = radiusMax === "" ? +Infinity : Number(radiusMax);
    return list
      .filter((r) => {
        const rad = r.radius ?? 0;
        return rad >= min && rad <= max;
      })
      .map((r) => ({ ...r, employeeCount: 0 }));
  }, [data, radiusMin, radiusMax]);

  const pagination = useMemo(() => {
    const p = data?.pagination ?? { page: 1, pageSize: 10, total: rows.length };
    return { page: p.page, pageSize: p.pageSize, total: p.total };
  }, [data, rows.length]);

  const onTableChange = useCallback((pg) => {
    setPage(pg.current);
    setPageSize(pg.pageSize);
  }, []);

  const fetchList = useCallback(() => mutate(), [mutate]);

  // CREATE
  const addLocation = useCallback(
    async ({ nama_kantor, latitude, longitude, radius }) => {
      const payload = {
        nama_kantor: String(nama_kantor || "").trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius:
          radius === "" || radius === null || radius === undefined
            ? null
            : Number(radius),
      };

      if (!payload.nama_kantor) throw new Error("Nama lokasi wajib diisi.");
      if (Number.isNaN(payload.latitude) || payload.latitude < -90 || payload.latitude > 90) {
        throw new Error("Latitude tidak valid (-90..90).");
      }
      if (Number.isNaN(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) {
        throw new Error("Longitude tidak valid (-180..180).");
      }
      if (payload.radius !== null && (Number.isNaN(payload.radius) || payload.radius < 0)) {
        throw new Error("Radius tidak valid (>= 0) atau kosongkan.");
      }

      try {
        await crudService.post(ApiEndpoints.CreateLocation, payload);
        notification.success({ message: "Berhasil", description: "Lokasi dibuat." });
        await mutate();
      } catch (err) {
        notification.error({
          message: "Gagal",
          description: err?.message || "Tidak dapat menambah lokasi.",
        });
        throw err;
      }
    },
    [notification, mutate]
  );

  // UPDATE
  const updateLocation = useCallback(
    async (id, { nama_kantor, latitude, longitude, radius }) => {
      const payload = {};
      if (nama_kantor !== undefined) payload.nama_kantor = String(nama_kantor || "").trim();
      if (latitude !== undefined) {
        const val = Number(latitude);
        if (Number.isNaN(val) || val < -90 || val > 90) {
          throw new Error("Latitude tidak valid (-90..90).");
        }
        payload.latitude = val;
      }
      if (longitude !== undefined) {
        const val = Number(longitude);
        if (Number.isNaN(val) || val < -180 || val > 180) {
          throw new Error("Longitude tidak valid (-180..180).");
        }
        payload.longitude = val;
      }
      if (radius !== undefined) {
        payload.radius = radius === "" || radius === null ? null : Number(radius);
        if (payload.radius !== null && (Number.isNaN(payload.radius) || payload.radius < 0)) {
          throw new Error("Radius tidak valid (>= 0) atau kosongkan.");
        }
      }

      try {
        await crudService.put(ApiEndpoints.UpdateLocation(id), payload);
        notification.success({ message: "Berhasil", description: "Lokasi diperbarui." });
        await mutate();
      } catch (err) {
        notification.error({
          message: "Gagal",
          description: err?.message || "Tidak dapat memperbarui lokasi.",
        });
        throw err;
      }
    },
    [notification, mutate]
  );

  // DELETE (soft delete di API)
  const deleteLocation = useCallback(
    async (id) => {
      try {
        await crudService.delete(ApiEndpoints.DeleteLocation(id));
        notification.success({ message: "Berhasil", description: "Lokasi dihapus." });
        await mutate();
      } catch (err) {
        notification.error({
          message: "Gagal",
          description: err?.message || "Tidak dapat menghapus lokasi.",
        });
        throw err;
      }
    },
    [notification, mutate]
  );

  return {
    // data
    rows, loading, pagination,

    // filters
    search, setSearch,
    radiusMin, setRadiusMin,
    radiusMax, setRadiusMax,
    orderBy, setOrderBy,
    sort, setSort,

    // handlers
    onTableChange,
    fetchList,

    // actions
    addLocation,
    updateLocation,
    deleteLocation,

    // style token if needed elsewhere
    ACCENT,
  };
}
