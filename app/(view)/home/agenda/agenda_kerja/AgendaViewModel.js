"use client";

import { useEffect, useState } from "react";

export default function useAgendaViewModel() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      const today = new Date().toISOString().slice(0, 10);
      setItems([
        { id: 1, title: "Rapat Tim Pagi", date: today },
        { id: 2, title: "Follow-up Klien ABC", date: today },
      ]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  };

  return { loading, items, refresh };
}
