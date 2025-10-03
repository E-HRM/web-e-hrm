"use client";

import { Suspense, lazy } from "react";
const EditContent = lazy(() => import("./EditContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditContent />
    </Suspense>
  );
}
