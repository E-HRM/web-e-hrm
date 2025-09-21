"use client";

import useSWR from "swr";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { fetcher } from "../../../utils/fetcher";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

export default function useAbsensiViewModel() {
  // filter per kartu
  const [dateIn, setDateIn] = useState(dayjs());
  const [dateOut, setDateOut] = useState(dayjs());
  const [filterIn, setFilterIn]   = useState({ q: "", divisi: undefined, status: undefined });
  const [filterOut, setFilterOut] = useState({ q: "", divisi: undefined, status: undefined });

  // build URL via ApiEndpoints
  const urlIn = useMemo(() => {
    const qs = {
      date: dateIn ? dayjs(dateIn).format("YYYY-MM-DD") : undefined,
      type: "in",
      q: filterIn.q || undefined,
      divisi: filterIn.divisi || undefined,
      status: filterIn.status || undefined,
    };
    return ApiEndpoints.GetAbsensiRecords(qs);
  }, [dateIn, filterIn]);

  const urlOut = useMemo(() => {
    const qs = {
      date: dateOut ? dayjs(dateOut).format("YYYY-MM-DD") : undefined,
      type: "out",
      q: filterOut.q || undefined,
      divisi: filterOut.divisi || undefined,
      status: filterOut.status || undefined,
    };
    return ApiEndpoints.GetAbsensiRecords(qs);
  }, [dateOut, filterOut]);

  const { data: resIn,  isLoading: loadingIn  } = useSWR(urlIn,  fetcher, { keepPreviousData: true });
  const { data: resOut, isLoading: loadingOut } = useSWR(urlOut, fetcher, { keepPreviousData: true });

  const kedatangan = resIn?.data || [];
  const kepulangan = resOut?.data || [];

  const divisiOptions = (resIn?.facets?.divisi || resOut?.facets?.divisi || []).map((d) => ({ value: d, label: d }));
  const statusOptionsIn = [
    { value: "tepat",      label: "Tepat Waktu" },
    { value: "terlambat",  label: "Terlambat"   },
    { value: "izin",       label: "Izin"        },
    { value: "sakit",      label: "Sakit"       },
  ];
  const statusOptionsOut = [
    { value: "tepat",  label: "Tepat Waktu" },
    { value: "lembur", label: "Lembur"      },
  ];

  return {
    kedatangan, kepulangan,
    loadingIn, loadingOut,
    dateIn, setDateIn,
    dateOut, setDateOut,
    filterIn, setFilterIn,
    filterOut, setFilterOut,
    divisiOptions,
    statusOptionsIn,
    statusOptionsOut,
  };
}
