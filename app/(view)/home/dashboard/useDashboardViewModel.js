"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API = "/api/admin/dashboard";

export default function useDashboardViewModel() {
  // ===== Filters / UI state =====
  const [division, setDivision] = useState(""); // filter chart per divisi
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  // Performa (API menyediakan rows per-tab)
  const [perfDate, setPerfDate] = useState(new Date().toISOString().slice(0, 10));
  const [perfDivision, setPerfDivision] = useState("");
  const [perfTab, setPerfTab] = useState("late");
  const [perfQuery, setPerfQuery] = useState("");

  const [top5Period, setTop5Period] = useState("this"); // this | last

  // ===== Data =====
  const [loading, setLoading] = useState(false);

  const [tanggalTampilan, setTanggalTampilan] = useState("");
  const [totalKaryawan, setTotalKaryawan] = useState(0);
  const [totalDivisi, setTotalDivisi] = useState(0);
  const [statCards, setStatCards] = useState({
    lokasi: 0, presensi: 0, admin: 0, polaKerja: 0, izin: 0,
  });

  const [miniBars, setMiniBars] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);

  const [onLeaveCount, setOnLeaveCount] = useState(0);
  const [leaveList, setLeaveList] = useState([]);

  const [top5LateData, setTop5LateData] = useState({ this: [], last: [] });
  const [top5DisciplineData, setTop5DisciplineData] = useState({ this: [], last: [] });

  const [calendar, setCalendar] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    eventsByDay: {},
  });

  // Performa metadata
  const [perfTabs, setPerfTabs] = useState([]);
  const [perfDivisionOptions, setPerfDivisionOptions] = useState([]);
  const [perfRows, setPerfRows] = useState({ onTime: [], late: [], absent: [], autoOut: [], leave: [], permit: [] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Dashboard (chart + calendar)
      if (division) params.set("divisionId", division);
      params.set("calendarYear", String(calYear));
      params.set("calendarMonth", String(calMonth));

      // Performance block
      if (perfDate) params.set("performanceDate", perfDate);
      if (perfDivision) params.set("performanceDivisionId", perfDivision);
      if (perfQuery?.trim()) params.set("performanceQuery", perfQuery.trim());

      const res = await fetch(`${API}?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      // Header & stats
      setTanggalTampilan(data.tanggalTampilan || "");
      setTotalKaryawan(data.totalKaryawan || 0);
      setTotalDivisi(data.totalDivisi || 0);
      setStatCards(data.statCards || { lokasi: 0, presensi: 0, admin: 0, polaKerja: 0, izin: 0 });

      // Graphs & options
      setMiniBars(Array.isArray(data.miniBars) ? data.miniBars : []);
      setChartData(Array.isArray(data.chartData) ? data.chartData : []);
      setDivisionOptions(Array.isArray(data.divisionOptions) ? data.divisionOptions : []);

      // Leave list
      setOnLeaveCount(data.onLeaveCount ?? 0);
      setLeaveList(Array.isArray(data.leaveList) ? data.leaveList : []);

      // Top 5
      setTop5LateData(data.top5Late || { this: [], last: [] });
      setTop5DisciplineData(data.top5Discipline || { this: [], last: [] });

      // Calendar
      setCalendar({
        year: data?.calendar?.year ?? calYear,
        month: data?.calendar?.month ?? calMonth,
        eventsByDay: data?.calendar?.eventsByDay || {},
      });

      // Performance (tabs, options, date, rows)
      setPerfTabs(Array.isArray(data.perfTabs) ? data.perfTabs : []);
      setPerfDivisionOptions(Array.isArray(data.perfDivisionOptions) ? data.perfDivisionOptions : []);
      if (data.perfDate) {
        // normalize to YYYY-MM-DD for <input type="date">
        const d = new Date(data.perfDate);
        if (!isNaN(d)) setPerfDate(d.toISOString().slice(0, 10));
      }
      setPerfRows(
        data.perfRows && typeof data.perfRows === "object"
          ? {
              onTime: data.perfRows.onTime || [],
              late: data.perfRows.late || [],
              absent: data.perfRows.absent || [],
              autoOut: data.perfRows.autoOut || [],
              leave: data.perfRows.leave || [],
              permit: data.perfRows.permit || [],
            }
          : { onTime: [], late: [], absent: [], autoOut: [], leave: [], permit: [] }
      );
    } catch (e) {
      console.error("fetch dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }, [division, calYear, calMonth, perfDate, perfDivision, perfQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calendar navigation
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

  // Derivatives
  const top5Late = useMemo(
    () => (top5Period === "this" ? (top5LateData.this || []) : (top5LateData.last || [])),
    [top5Period, top5LateData]
  );
  const top5Discipline = useMemo(
    () => (top5Period === "this" ? (top5DisciplineData.this || []) : (top5DisciplineData.last || [])),
    [top5Period, top5DisciplineData]
  );

  const currentPerfRows = useMemo(() => {
    const bag = perfRows || {};
    return Array.isArray(bag[perfTab]) ? bag[perfTab] : [];
  }, [perfRows, perfTab]);

  return {
    loading,

    // Header & stats
    tanggalTampilan,
    totalKaryawan,
    totalDivisi,
    statCards,

    // Mini bars & chart
    miniBars,
    chartData,
    division,
    setDivision,
    divisionOptions,

    // Leave
    onLeaveCount,
    leaveList,

    // Calendar
    today: new Date(),
    calYear,
    calMonth,
    prevMonth,
    nextMonth,
    calendarEvents: calendar.eventsByDay,

    // Performance
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
    currentPerfRows, // ← dipakai di halaman

    // Top 5
    top5Period,
    setTop5Period,
    top5Late,
    top5Discipline,
  };
}
