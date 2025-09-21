"use client";

import { Suspense, lazy } from "react";
import Loading from "../../../../components/common/Loading"

const Aktivitas = lazy(() => import("./AktivitasContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Aktivitas />
    </Suspense>
  );
}
