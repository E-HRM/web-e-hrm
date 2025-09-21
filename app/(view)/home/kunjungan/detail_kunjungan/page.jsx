"use client";

import { Suspense, lazy } from "react";
import DetailKunjunganContent from "./DetailKunjunganContent";

const DetailKunjungan = lazy(() => import("./DetailKunjunganContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DetailKunjunganContent />
    </Suspense>
  );
}
