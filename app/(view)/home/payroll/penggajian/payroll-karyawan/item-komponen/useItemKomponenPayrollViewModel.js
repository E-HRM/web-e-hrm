"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

import AppMessage from "@/app/(view)/component_shared/AppMessage";
import { crudServiceAuth } from "@/app/utils/services/crudServiceAuth";
import { ApiEndpoints } from "@/constrainst/endpoints";

const ITEM_KOMPONEN_SWR_KEY = "payroll:item-komponen-payroll:list";
const DEFINISI_KOMPONEN_SWR_KEY = "payroll:definisi-komponen-payroll:options";
const TIPE_KOMPONEN_SWR_KEY = "payroll:tipe-komponen-payroll:options";
const FETCH_PAGE_SIZE = 100;

const STATUS_PAYROLL_IMMUTABLE = new Set(["DISETUJUI", "DIBAYAR"]);
const STATUS_PERIODE_IMMUTABLE = new Set(["FINAL", "TERKUNCI"]);

const ARAH_KOMPONEN_OPTIONS = [
  { value: "PEMASUKAN", label: "Pemasukan" },
  { value: "POTONGAN", label: "Potongan" },
];

function buildQS(obj = {}) {
  const params = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    const normalized = String(value).trim();

    if (!normalized) return;

    params.set(key, normalized);
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

function buildItemKomponenEndpoint(qsObj = {}) {
  return `/api/admin/item-komponen-payroll${buildQS(qsObj)}`;
}

function buildItemKomponenByIdEndpoint(id, qsObj = {}) {
  return `/api/admin/item-komponen-payroll/${id}${buildQS(qsObj)}`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeUpperText(value) {
  return normalizeText(value).toUpperCase();
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatEnumLabel(value) {
  const raw = normalizeText(value);

  if (!raw) return "-";

  return raw
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parseNumber(value));
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function createInitialItemKomponenForm() {
  return {
    id_definisi_komponen_payroll: null,
    nama_komponen: "",
    tipe_komponen: "",
    arah_komponen: "PEMASUKAN",
    nominal: 0,
    kena_pajak: false,
    urutan_tampil: 0,
    catatan: "",
  };
}

async function fetchAllPages(fetcher) {
  const merged = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetcher(page);
    const items = Array.isArray(response?.data) ? response.data : [];

    merged.push(...items);

    const nextTotalPages = Number(response?.pagination?.totalPages);
    totalPages =
      Number.isFinite(nextTotalPages) && nextTotalPages > 0
        ? nextTotalPages
        : 1;
    page += 1;
  }

  return merged;
}

async function fetchDefinisiKomponenOptions() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetDefinisiKomponenPayroll({
        page,
        pageSize: FETCH_PAGE_SIZE,
        aktif: "true",
        orderBy: "nama_komponen",
        sort: "asc",
      }),
    ),
  );
}

async function fetchTipeKomponenOptions() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetTipeKomponenPayroll({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: "nama_tipe_komponen",
        sort: "asc",
      }),
    ),
  );
}

function normalizeTipeKomponen(item) {
  if (!item) return null;

  const id = normalizeText(item.id_tipe_komponen_payroll);
  const nama = normalizeText(item.nama_tipe_komponen);

  if (!id || !nama) return null;

  return {
    id_tipe_komponen_payroll: id,
    nama_tipe_komponen: nama,
    deleted_at: item.deleted_at || null,
  };
}

function normalizeDefinition(item) {
  if (!item) return null;

  const id = normalizeText(item.id_definisi_komponen_payroll);

  if (!id) return null;

  const tipeKomponen =
    typeof item.tipe_komponen === "string"
      ? item.tipe_komponen
      : item.tipe_komponen?.nama_tipe_komponen;

  return {
    id_definisi_komponen_payroll: id,
    id_tipe_komponen_payroll: normalizeText(item.id_tipe_komponen_payroll),
    nama_komponen: normalizeText(item.nama_komponen),
    tipe_komponen: normalizeUpperText(tipeKomponen),
    arah_komponen: normalizeUpperText(item.arah_komponen),
    kena_pajak_default: Boolean(item.kena_pajak_default),
    aktif: Boolean(item.aktif),
    deleted_at: item.deleted_at || null,
  };
}

function normalizeItem(item) {
  if (!item) return null;

  return {
    ...item,
    nominal_number: parseNumber(item.nominal),
    payroll_karyawan: item.payroll_karyawan || null,
    definisi_komponen: item.definisi_komponen || null,
    business_state: item.business_state || {},
  };
}

function createPayrollContextFromSearch(searchParams) {
  const get = (key) => normalizeText(searchParams?.get(key));

  return {
    id_payroll_karyawan: get("id_payroll_karyawan"),
    id_periode_payroll: get("id_periode_payroll"),
    id_user: get("id_user"),
    id_tarif_pajak_ter: get("id_tarif_pajak_ter"),
    nama_karyawan: get("nama_karyawan"),
    departement: get("departement"),
    jabatan: get("jabatan"),
    periode_label: get("periode_label"),
    jenis_hubungan_kerja: get("jenis_hubungan_kerja") || get("jenis_hubungan"),
    kode_kategori_pajak_snapshot: get("kode_kategori_pajak_snapshot"),
    persen_tarif_snapshot: parseNumber(get("persen_tarif_snapshot")),
    status_payroll: normalizeUpperText(get("status_payroll")) || "DRAFT",
    periode_status: normalizeUpperText(get("periode_status")),
    total_pendapatan_bruto: parseNumber(
      get("total_pendapatan_bruto") || get("total_bruto_kena_pajak"),
    ),
    total_potongan: parseNumber(get("total_potongan")),
    pph21_nominal: parseNumber(get("pph21_nominal") || get("total_pajak")),
    pendapatan_bersih: parseNumber(
      get("pendapatan_bersih") || get("total_dibayarkan"),
    ),
  };
}

function normalizePayrollFromItem(payroll) {
  if (!payroll) return null;

  const periodeLabel =
    payroll?.periode?.bulan && payroll?.periode?.tahun
      ? `${formatEnumLabel(payroll.periode.bulan)} ${payroll.periode.tahun}`
      : "-";

  return {
    id_payroll_karyawan: payroll.id_payroll_karyawan,
    id_periode_payroll: payroll.id_periode_payroll,
    id_user: payroll.id_user,
    id_tarif_pajak_ter: normalizeText(payroll.id_tarif_pajak_ter),
    nama_karyawan: normalizeText(
      payroll.nama_karyawan || payroll?.user?.nama_pengguna,
    ),
    departement: normalizeText(payroll?.user?.departement?.nama_departement),
    jabatan: normalizeText(payroll?.user?.jabatan?.nama_jabatan),
    periode_label: periodeLabel,
    jenis_hubungan_kerja: normalizeUpperText(payroll.jenis_hubungan_kerja),
    kode_kategori_pajak_snapshot: normalizeText(
      payroll.kode_kategori_pajak_snapshot ||
        payroll?.tarif_pajak_ter?.kode_kategori_pajak,
    ),
    persen_tarif_snapshot: parseNumber(
      payroll.persen_tarif_snapshot || payroll?.tarif_pajak_ter?.persen_tarif,
    ),
    bank_name: normalizeText(payroll.bank_name || payroll?.user?.jenis_bank),
    bank_account: normalizeText(
      payroll.bank_account || payroll?.user?.nomor_rekening,
    ),
    status_payroll: normalizeUpperText(payroll.status_payroll),
    periode_status: normalizeUpperText(payroll?.periode?.status_periode),
    total_pendapatan_bruto: parseNumber(payroll.total_pendapatan_bruto),
    total_potongan: parseNumber(payroll.total_potongan),
    pph21_nominal: parseNumber(payroll.pph21_nominal),
    pendapatan_bersih: parseNumber(payroll.pendapatan_bersih),
    finalized_at: payroll.finalized_at || null,
    locked_at: payroll.locked_at || null,
  };
}

function validateItemForm({ payrollId, formData, usingDefinition }) {
  if (!payrollId) {
    AppMessage.warning("Payroll karyawan belum dipilih.");
    return false;
  }

  const nominal = parseNumber(formData.nominal);

  if (nominal <= 0) {
    AppMessage.warning("Nominal wajib lebih besar dari 0.");
    return false;
  }

  if (!usingDefinition) {
    if (!normalizeText(formData.nama_komponen)) {
      AppMessage.warning("Nama komponen wajib diisi.");
      return false;
    }

    if (!normalizeUpperText(formData.tipe_komponen)) {
      AppMessage.warning("Tipe komponen wajib dipilih.");
      return false;
    }

    if (!normalizeUpperText(formData.arah_komponen)) {
      AppMessage.warning("Arah komponen wajib dipilih.");
      return false;
    }

    if (
      normalizeUpperText(formData.tipe_komponen) === "PAJAK" &&
      normalizeUpperText(formData.arah_komponen) !== "POTONGAN"
    ) {
      AppMessage.warning("Komponen pajak wajib memiliki arah 'Potongan'.");
      return false;
    }
  }

  if (normalizeUpperText(formData.tipe_komponen) === "PAJAK") {
    AppMessage.warning(
      "Komponen PAJAK dihitung otomatis dari payroll dan tidak dapat dikelola manual.",
    );
    return false;
  }

  return true;
}

function buildPayload({ payrollId, formData, usingDefinition }) {
  const payload = {
    id_payroll_karyawan: payrollId,
    id_definisi_komponen_payroll: usingDefinition
      ? normalizeText(formData.id_definisi_komponen_payroll) || null
      : null,
    nominal: parseNumber(formData.nominal),
    urutan_tampil: Number.isFinite(Number(formData.urutan_tampil))
      ? Number(formData.urutan_tampil)
      : 0,
    catatan: normalizeText(formData.catatan) || null,
  };

  if (!usingDefinition) {
    payload.nama_komponen = normalizeText(formData.nama_komponen);
    payload.tipe_komponen = normalizeUpperText(formData.tipe_komponen);
    payload.arah_komponen = normalizeUpperText(formData.arah_komponen);
    payload.kena_pajak = Boolean(formData.kena_pajak);
  }

  return payload;
}

export default function useItemKomponenPayrollViewModel() {
  const searchParams = useSearchParams();
  const searchContext = useMemo(
    () => createPayrollContextFromSearch(searchParams),
    [searchParams],
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipeKomponen, setFilterTipeKomponen] = useState();
  const [filterArahKomponen, setFilterArahKomponen] = useState();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(createInitialItemKomponenForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTipeKomponen, filterArahKomponen]);

  const itemsKey = searchContext.id_payroll_karyawan
    ? [
        ITEM_KOMPONEN_SWR_KEY,
        searchContext.id_payroll_karyawan,
        page,
        pageSize,
        searchQuery,
        filterTipeKomponen,
        filterArahKomponen,
      ]
    : null;

  const {
    data: itemsResponse,
    error: itemsError,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    itemsKey,
    ([, payrollId, currentPage, currentPageSize, search, tipe, arah]) =>
      crudServiceAuth.get(
        buildItemKomponenEndpoint({
          id_payroll_karyawan: payrollId,
          page: currentPage,
          pageSize: currentPageSize,
          search,
          tipe_komponen: tipe,
          arah_komponen: arah,
          orderBy: "urutan_tampil",
          sort: "asc",
        }),
      ),
    { revalidateOnFocus: false },
  );

  const {
    data: definisiResponse,
    error: definisiError,
    isLoading: isDefinisiLoading,
    mutate: mutateDefinisi,
  } = useSWR(DEFINISI_KOMPONEN_SWR_KEY, fetchDefinisiKomponenOptions, {
    revalidateOnFocus: false,
  });

  const {
    data: tipeKomponenResponse,
    error: tipeKomponenError,
    isLoading: isTipeKomponenLoading,
    mutate: mutateTipeKomponen,
  } = useSWR(TIPE_KOMPONEN_SWR_KEY, fetchTipeKomponenOptions, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!itemsError) return;

    AppMessage.once({
      type: "error",
      onceKey: "item-komponen-payroll-fetch-error",
      content: itemsError?.message || "Gagal memuat item komponen payroll.",
    });
  }, [itemsError]);

  useEffect(() => {
    if (!definisiError) return;

    AppMessage.once({
      type: "error",
      onceKey: "item-komponen-payroll-definisi-fetch-error",
      content:
        definisiError?.message || "Gagal memuat definisi komponen payroll.",
    });
  }, [definisiError]);

  useEffect(() => {
    if (!tipeKomponenError) return;

    AppMessage.once({
      type: "error",
      onceKey: "item-komponen-payroll-tipe-fetch-error",
      content:
        tipeKomponenError?.message ||
        "Gagal memuat master tipe komponen payroll.",
    });
  }, [tipeKomponenError]);

  const items = useMemo(() => {
    const rawItems = Array.isArray(itemsResponse?.data)
      ? itemsResponse.data
      : [];
    return rawItems.map(normalizeItem).filter(Boolean);
  }, [itemsResponse]);

  const definitions = useMemo(() => {
    const rawItems = Array.isArray(definisiResponse) ? definisiResponse : [];
    return rawItems
      .map(normalizeDefinition)
      .filter(
        (item) =>
          item &&
          !item.deleted_at &&
          item.aktif &&
          item.tipe_komponen !== "PAJAK",
      );
  }, [definisiResponse]);

  const tipeKomponenMaster = useMemo(() => {
    const rawItems = Array.isArray(tipeKomponenResponse)
      ? tipeKomponenResponse
      : [];
    return rawItems
      .map(normalizeTipeKomponen)
      .filter(
        (item) =>
          item &&
          !item.deleted_at &&
          normalizeUpperText(item.nama_tipe_komponen) !== "PAJAK",
      );
  }, [tipeKomponenResponse]);

  const tipeKomponenOptions = useMemo(() => {
    return tipeKomponenMaster.map((item) => ({
      value: normalizeUpperText(item.nama_tipe_komponen),
      label: formatEnumLabel(item.nama_tipe_komponen),
    }));
  }, [tipeKomponenMaster]);

  const definitionsOptions = useMemo(() => {
    return definitions.map((item) => ({
      value: item.id_definisi_komponen_payroll,
      label: `${item.nama_komponen} • ${formatEnumLabel(item.tipe_komponen)} • ${formatEnumLabel(item.arah_komponen)}`,
    }));
  }, [definitions]);

  const pagination = useMemo(() => {
    const rawPagination = itemsResponse?.pagination || {};

    return {
      current: Number(rawPagination.page) || page,
      pageSize: Number(rawPagination.pageSize) || pageSize,
      total: Number(rawPagination.total) || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total) => `Total ${total} item`,
    };
  }, [itemsResponse, page, pageSize]);

  const currentPayroll = useMemo(() => {
    const fromItem = normalizePayrollFromItem(items?.[0]?.payroll_karyawan);

    if (fromItem) return fromItem;

    return {
      id_payroll_karyawan: searchContext.id_payroll_karyawan,
      id_periode_payroll: searchContext.id_periode_payroll,
      id_user: searchContext.id_user,
      id_tarif_pajak_ter: searchContext.id_tarif_pajak_ter,
      nama_karyawan: searchContext.nama_karyawan,
      departement: searchContext.departement,
      jabatan: searchContext.jabatan,
      periode_label: searchContext.periode_label,
      jenis_hubungan_kerja: searchContext.jenis_hubungan_kerja,
      kode_kategori_pajak_snapshot: searchContext.kode_kategori_pajak_snapshot,
      persen_tarif_snapshot: searchContext.persen_tarif_snapshot,
      bank_name: "",
      bank_account: "",
      status_payroll: searchContext.status_payroll,
      periode_status: searchContext.periode_status,
      total_pendapatan_bruto: searchContext.total_pendapatan_bruto,
      total_potongan: searchContext.total_potongan,
      pph21_nominal: searchContext.pph21_nominal,
      pendapatan_bersih: searchContext.pendapatan_bersih,
    };
  }, [items, searchContext]);

  const pageBusinessState = useMemo(() => {
    const fromItem = items?.[0]?.business_state || {};

    const payrollImmutable =
      Boolean(fromItem.payroll_immutable) ||
      STATUS_PAYROLL_IMMUTABLE.has(
        normalizeUpperText(currentPayroll.status_payroll),
      );

    const periodeImmutable =
      Boolean(fromItem.periode_immutable) ||
      STATUS_PERIODE_IMMUTABLE.has(
        normalizeUpperText(currentPayroll.periode_status),
      );

    return {
      payroll_immutable: payrollImmutable,
      periode_immutable: periodeImmutable,
    };
  }, [items, currentPayroll]);

  const isReadonly =
    pageBusinessState.payroll_immutable || pageBusinessState.periode_immutable;

  const readonlyReason = useMemo(() => {
    if (pageBusinessState.periode_immutable) {
      return `Periode payroll berada pada status ${formatEnumLabel(
        currentPayroll.periode_status,
      )} sehingga item komponen menjadi read only.`;
    }

    if (pageBusinessState.payroll_immutable) {
      return `Payroll karyawan berada pada status ${formatEnumLabel(
        currentPayroll.status_payroll,
      )} sehingga item komponen tidak dapat diubah.`;
    }

    return "";
  }, [pageBusinessState, currentPayroll]);

  const statistics = useMemo(() => {
    const totalItems = items.length;
    const totalPemasukan = items
      .filter((item) => item.arah_komponen === "PEMASUKAN")
      .reduce((sum, item) => sum + parseNumber(item.nominal), 0);

    const totalPotongan = items
      .filter((item) => item.arah_komponen === "POTONGAN")
      .reduce((sum, item) => sum + parseNumber(item.nominal), 0);

    const totalKenaPajak = items
      .filter((item) => item.kena_pajak)
      .reduce((sum, item) => sum + parseNumber(item.nominal), 0);

    return {
      totalItems,
      totalPemasukan,
      totalPotongan,
      totalKenaPajak,
      pendapatanBersih:
        parseNumber(currentPayroll.pendapatan_bersih) ||
        Math.max(totalPemasukan - totalPotongan, 0),
    };
  }, [items, currentPayroll]);

  const selectedDefinition = useMemo(() => {
    const id = normalizeText(formData.id_definisi_komponen_payroll);

    if (!id) return null;

    return (
      definitions.find((item) => item.id_definisi_komponen_payroll === id) ||
      null
    );
  }, [definitions, formData.id_definisi_komponen_payroll]);

  const isUsingDefinition = Boolean(selectedDefinition);
  const isEditMode = Boolean(selectedItem?.id_item_komponen_payroll);

  useEffect(() => {
    if (isUsingDefinition) return;

    if (formData.tipe_komponen) return;

    const firstOption = tipeKomponenOptions[0]?.value;

    if (!firstOption) return;

    setFormData((prev) => {
      if (prev.id_definisi_komponen_payroll || prev.tipe_komponen) {
        return prev;
      }

      return {
        ...prev,
        tipe_komponen: firstOption,
      };
    });
  }, [formData.tipe_komponen, isUsingDefinition, tipeKomponenOptions]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleDefinitionChange = useCallback(
    (definitionId) => {
      const normalizedId = normalizeText(definitionId) || null;
      const definition =
        definitions.find(
          (item) => item.id_definisi_komponen_payroll === normalizedId,
        ) || null;

      setFormData((prev) => ({
        ...prev,
        id_definisi_komponen_payroll: normalizedId,
        ...(definition
          ? {
              nama_komponen: definition.nama_komponen,
              tipe_komponen: definition.tipe_komponen,
              arah_komponen: definition.arah_komponen,
              kena_pajak: Boolean(definition.kena_pajak_default),
            }
          : {}),
      }));
    },
    [definitions],
  );

  const resetForm = useCallback(() => {
    setFormData(createInitialItemKomponenForm());
  }, []);

  const openCreateModal = useCallback(() => {
    if (isReadonly) {
      AppMessage.warning(readonlyReason || "Payroll ini tidak dapat diubah.");
      return;
    }

    setSelectedItem(null);
    resetForm();
    setIsFormModalOpen(true);
  }, [isReadonly, readonlyReason, resetForm]);

  const closeFormModal = useCallback(() => {
    if (isSubmitting) return;

    setIsFormModalOpen(false);
    setSelectedItem(null);
    resetForm();
  }, [isSubmitting, resetForm]);

  const openEditModal = useCallback((item) => {
    if (!item) return;

    if (!item?.business_state?.bisa_diubah) {
      AppMessage.warning("Item komponen payroll ini tidak dapat diperbarui.");
      return;
    }

    setSelectedItem(item);
    setFormData({
      id_definisi_komponen_payroll: item.id_definisi_komponen_payroll || null,
      nama_komponen: item.nama_komponen || "",
      tipe_komponen: item.tipe_komponen || "",
      arah_komponen: item.arah_komponen || "PEMASUKAN",
      nominal: parseNumber(item.nominal),
      kena_pajak: Boolean(item.kena_pajak),
      urutan_tampil: Number.isFinite(Number(item.urutan_tampil))
        ? Number(item.urutan_tampil)
        : 0,
      catatan: item.catatan || "",
    });
    setIsFormModalOpen(true);
  }, []);

  const openDetailModal = useCallback((item) => {
    if (!item) return;
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  }, []);

  const openDeleteDialog = useCallback((item) => {
    if (!item) return;

    if (!item?.business_state?.bisa_dihapus) {
      AppMessage.warning("Item komponen payroll ini tidak dapat dihapus.");
      return;
    }

    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;

    setIsDeleteDialogOpen(false);
    setSelectedItem(null);
  }, [isSubmitting]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return false;

    if (isReadonly) {
      AppMessage.warning(readonlyReason || "Payroll ini tidak dapat diubah.");
      return false;
    }

    if (
      !validateItemForm({
        payrollId: searchContext.id_payroll_karyawan,
        formData,
        usingDefinition: isUsingDefinition,
      })
    ) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload({
        payrollId: searchContext.id_payroll_karyawan,
        formData,
        usingDefinition: isUsingDefinition,
      });

      const response = isEditMode
        ? await crudServiceAuth.put(
            buildItemKomponenByIdEndpoint(
              selectedItem.id_item_komponen_payroll,
            ),
            payload,
          )
        : await crudServiceAuth.post(buildItemKomponenEndpoint(), payload);

      await mutate();

      setIsFormModalOpen(false);
      setSelectedItem(null);
      resetForm();

      AppMessage.success(
        response?.message ||
          (isEditMode
            ? "Item komponen payroll berhasil diperbarui."
            : "Item komponen payroll berhasil dibuat."),
      );

      return true;
    } catch (err) {
      AppMessage.error(
        err?.message || "Gagal menyimpan item komponen payroll.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    isEditMode,
    isReadonly,
    isSubmitting,
    isUsingDefinition,
    mutate,
    readonlyReason,
    resetForm,
    searchContext.id_payroll_karyawan,
    selectedItem,
  ]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return false;

    if (!selectedItem?.id_item_komponen_payroll) {
      AppMessage.warning("Item komponen payroll tidak ditemukan.");
      return false;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.delete(
        buildItemKomponenByIdEndpoint(selectedItem.id_item_komponen_payroll),
      );

      await mutate();

      setIsDeleteDialogOpen(false);
      setSelectedItem(null);

      AppMessage.success(
        response?.message || "Item komponen payroll berhasil dihapus.",
      );
      return true;
    } catch (err) {
      AppMessage.error(
        err?.message || "Gagal menghapus item komponen payroll.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutate, selectedItem]);

  const reload = useCallback(async () => {
    await Promise.all([mutate(), mutateDefinisi(), mutateTipeKomponen()]);
  }, [mutate, mutateDefinisi, mutateTipeKomponen]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterTipeKomponen(undefined);
    setFilterArahKomponen(undefined);
    setPage(1);
  }, []);

  const handleTableChange = useCallback((nextPagination) => {
    setPage(nextPagination?.current || 1);
    setPageSize(nextPagination?.pageSize || 10);
  }, []);

  return {
    payrollId: searchContext.id_payroll_karyawan,
    currentPayroll,
    items,
    pagination,
    statistics,

    searchQuery,
    filterTipeKomponen,
    filterArahKomponen,

    formData,
    selectedItem,

    isLoading,
    isValidating,
    isDefinisiLoading,
    isTipeKomponenLoading,
    isReadonly,
    readonlyReason,
    isFormModalOpen,
    isDetailModalOpen,
    isDeleteDialogOpen,
    isSubmitting,
    isUsingDefinition,
    isEditMode,

    tipeKomponenOptions,
    arahKomponenOptions: ARAH_KOMPONEN_OPTIONS,
    definitionsOptions,

    formatCurrency,
    formatDateTime,
    formatEnumLabel,

    setSearchQuery,
    setFilterTipeKomponen,
    setFilterArahKomponen,
    setFormValue,
    handleDefinitionChange,
    clearFilters,
    handleTableChange,

    openCreateModal,
    openEditModal,
    openDetailModal,
    openDeleteDialog,
    closeFormModal,
    closeDetailModal,
    closeDeleteDialog,
    handleSubmit,
    handleDelete,
    reload,
  };
}
