"use client";

import { Suspense, lazy } from "react";

const Proyek = lazy(() => import("./ProyekContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Proyek />
    </Suspense>
  );
}
