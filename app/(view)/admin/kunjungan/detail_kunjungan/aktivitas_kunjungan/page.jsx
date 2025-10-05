"use client";

import { Suspense, lazy } from "react";
import AktivitasContent from "../../../agenda/aktivitas/AktivitasContent";

const Aktivitas = lazy(() => import("./AktivitasContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AktivitasContent/>
    </Suspense>
  );
}

