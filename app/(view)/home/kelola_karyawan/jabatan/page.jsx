"use client";

import { Suspense, lazy } from "react";

const JabatanContent = lazy(() => import("./JabatanContent"));

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Memuat…</div>}>
      <JabatanContent />
    </Suspense>
  );
}
