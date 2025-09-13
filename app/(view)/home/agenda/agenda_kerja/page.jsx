"use client";

import { Suspense, lazy } from "react";

const Agenda = lazy(() => import("./AgendaContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Agenda />
    </Suspense>
  );
}
