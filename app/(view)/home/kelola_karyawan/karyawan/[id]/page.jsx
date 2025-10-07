"use client";

import { Suspense, lazy } from "react";
const KaryawanDetail = lazy(() => import("./KaryawanDetailContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KaryawanDetail />
    </Suspense>
  );
}
