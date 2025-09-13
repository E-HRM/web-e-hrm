"use client";

import { Suspense, lazy } from "react";

const ShiftContent = lazy(() => import("./ShiftContent"));

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading...</div>}>
      <ShiftContent />
    </Suspense>
  );
}
