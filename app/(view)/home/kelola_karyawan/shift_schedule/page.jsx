"use client";

import { Suspense, lazy } from "react";

const Shift = lazy(() => import("./ShiftSheduleContent"));

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading...</div>}>
      <Shift />
    </Suspense>
  );
}
