"use client";

import { Suspense, lazy } from "react";

const AddContent = lazy(() => import("./AddContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddContent />
    </Suspense>
  );
}
