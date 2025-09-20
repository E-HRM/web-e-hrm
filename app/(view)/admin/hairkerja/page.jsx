"use client";

import { Suspense, lazy } from "react";

const Lokasi = lazy(() => import("./HariKerjaContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Lokasi />
    </Suspense>
  );
}
