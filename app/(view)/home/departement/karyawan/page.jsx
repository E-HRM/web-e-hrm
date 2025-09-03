"use client";

import { Suspense, lazy } from "react";

const Karyawan = lazy(() => import("./KaryawanContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Karyawan />
    </Suspense>
  );
}
