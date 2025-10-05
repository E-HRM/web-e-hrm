"use client";

import { Suspense, lazy } from "react";
import KunjunganContent from "./KunjunganContent";

const Kunjungan = lazy(() => import("./KunjunganContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KunjunganContent/>
    </Suspense>
  );
}
