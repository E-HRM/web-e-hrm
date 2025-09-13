"use client";

import { useEffect, useState } from "react";

export default function useAktivitasViewModel() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setTasks([
        { id: 1, title: "Cek email & task board", time: "08:30", done: true },
        { id: 2, title: "Standup harian", time: "09:00", done: false },
        { id: 3, title: "Review dokumen", time: "10:30", done: false },
      ]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const toggle = (id) =>
    setTasks((xs) => xs.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  };

  return { loading, tasks, toggle, refresh };
}
