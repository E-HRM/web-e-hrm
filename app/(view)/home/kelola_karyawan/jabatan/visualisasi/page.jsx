"use client";

import { Suspense, lazy } from "react";

const JabatanGraph = lazy(() => import("./JabatanGraph"));

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Memuat visualisasi…</div>}>
      <JabatanGraph />
    </Suspense>
  );
}
