"use client";

import { Suspense, lazy } from "react";

const Broadcast = lazy(() => import("./BroadcastContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Broadcast /> 
    </Suspense>
  );
}
