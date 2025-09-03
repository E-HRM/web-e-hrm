"use client";

import { Suspense, lazy } from "react";

const Lokasi = lazy(() => import("./LokasiContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Lokasi />
    </Suspense>
  );
}
