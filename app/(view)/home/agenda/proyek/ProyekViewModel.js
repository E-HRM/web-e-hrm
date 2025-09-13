"use client";

import { useEffect, useState } from "react";

export default function useProyekViewModel() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setRows([
        { id: 1, name: "OSS HRIS", owner: "Dina", progress: 72, status: "On Track" },
        { id: 2, name: "Mobile Attendance", owner: "Raka", progress: 45, status: "At Risk" },
        { id: 3, name: "Integrasi Payroll", owner: "Tyo", progress: 20, status: "Planned" },
      ]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  };

  return { loading, rows, refresh };
}
