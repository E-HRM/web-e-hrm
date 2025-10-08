"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API = "/api/admin/dashboard";

function toDateInput(isoLike) {
  if (!isoLike) return "";
  // Pastikan format YYYY-MM-DD untuk <input type="date">
  return isoLike.slice(0, 10);
}

export default function useDashboardViewModel() {
  // ======== STATE FILTER / UI ========
  const today = useMemo(() => new Date(), []);
  const [division, setDivision] = useState("");              // untuk chart
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [perfDate, setPerfDate] = useState(toDateInput(new Date().toISOString()));
  const [perfDivision, setPerfDivision] = useState("");      // untuk performa
  const [perfTab, setPerfTab] = useState("late");
  const [perfQuery, setPerfQuery] = useState("");
  const [top5Period, setTop5Period] = useState("this");      // "this" | "last"

  // ======== DATA DARI API ========
  const [loading, setLoading] = useState(false);
  const [tanggalTampilan, setTanggalTampilan] = useState("");
  const [totalKaryawan, setTotalKaryawan] = useState(0);
  const [totalDivisi, setTotalDivisi] = useState(0);
  const [miniBars, setMiniBars] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [perfTabs, setPerfTabs] = useState([]);
  const [perfDivisionOptions, setPerfDivisionOptions] = useState([]);
  const [perfRowsByTab, setPerfRowsByTab] = useState({ onTime: [], late: [], absent: [], autoOut: [], leave: [], permit: [] });
  const [top5LateData, setTop5LateData] = useState({ this: [], last: [] });
  const [top5DisciplineData, setTop5DisciplineData] = useState({ this: [], last: [] });
  const [calendarEvents, setCalendarEvents] = useState({});
  const [todayDate, setTodayDate] = useState(new Date());

  // Section Cuti — dikosongkan sesuai permintaan
  const leaveList = [];
  const onLeaveCount = 0;

  // ======== FETCHER ========
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (division) params.set("divisionId", division);
      if (perfDate) params.set("performanceDate", perfDate);
      if (perfDivision !== undefined) params.set("performanceDivisionId", perfDivision);
      if (perfQuery) params.set("performanceQuery", perfQuery);
      params.set("calendarYear", String(calYear));
      params.set("calendarMonth", String(calMonth));

      const res = await fetch(`${API}?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      setTanggalTampilan(data.tanggalTampilan || "");
      setTotalKaryawan(data.totalKaryawan || 0);
      setTotalDivisi(data.totalDivisi || 0);
      setMiniBars(Array.isArray(data.miniBars) ? data.miniBars : []);
      setChartData(Array.isArray(data.chartData) ? data.chartData : []);

      setDivisionOptions(Array.isArray(data.divisionOptions) ? data.divisionOptions : []);
      // default division chart (hanya saat belum ada pilihan)
      if (!division && data.defaultDivisionId) {
        setDivision(data.defaultDivisionId);
      }

      // Perf tabs/options/rows
      setPerfTabs(Array.isArray(data.perfTabs) ? data.perfTabs : []);
      setPerfDivisionOptions(Array.isArray(data.perfDivisionOptions) ? data.perfDivisionOptions : []);
      setPerfRowsByTab(data.perfRows || { onTime: [], late: [], absent: [], autoOut: [], leave: [], permit: [] });

      // Top 5
      setTop5LateData(data.top5Late || { this: [], last: [] });
      setTop5DisciplineData(data.top5Discipline || { this: [], last: [] });

      // Calendar & today
      setCalendarEvents(data?.calendar?.eventsByDay || {});
      setTodayDate(data.todayIso ? new Date(data.todayIso) : new Date());

      // perfDate dari API → normalisasi utk <input type="date">
      if (data.perfDate) setPerfDate(toDateInput(data.perfDate));
    } catch (e) {
      console.error("fetch dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }, [division, perfDate, perfDivision, perfQuery, calYear, calMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ======== Calendar navigation ========
  const prevMonth = () => {
    setCalMonth((m) => {
      if (m === 0) {
        setCalYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const nextMonth = () => {
    setCalMonth((m) => {
      if (m === 11) {
        setCalYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  // ======== Derived for components ========
  const perfRows = useMemo(() => {
    const obj = perfRowsByTab || {};
    const arr = obj[perfTab];
    return Array.isArray(arr) ? arr : [];
  }, [perfRowsByTab, perfTab]);

  const top5Late = useMemo(() => (top5Period === "this" ? (top5LateData.this || []) : (top5LateData.last || [])), [top5Period, top5LateData]);
  const top5Discipline = useMemo(() => (top5Period === "this" ? (top5DisciplineData.this || []) : (top5DisciplineData.last || [])), [top5Period, top5DisciplineData]);

  return {
    // loading (opsional jika mau dipakai)
    loading,

    // header
    tanggalTampilan,
    totalKaryawan,
    totalDivisi,

    // mini bars (Total Karyawan)
    miniBars,

    // chart
    division,
    setDivision,
    divisionOptions,
    chartData,

    // leave list (kosong sesuai request)
    leaveList,
    onLeaveCount,

    // calendar
    today: todayDate,
    calYear,
    calMonth,
    prevMonth,
    nextMonth,
    calendarEvents,

    // performa
    perfTabs,
    perfDate,
    setPerfDate,
    perfDivision,
    setPerfDivision,
    perfDivisionOptions,
    perfTab,
    setPerfTab,
    perfQuery,
    setPerfQuery,
    perfRows,

    // top 5 (satu filter untuk dua kartu)
    top5Period,
    setTop5Period,
    top5Late,
    top5Discipline,
  };
}
