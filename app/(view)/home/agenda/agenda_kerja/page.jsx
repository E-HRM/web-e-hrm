"use client";

import { Suspense, lazy } from "react";
import Loading from "../../../../components/common/Loading"

const Agenda = lazy(() => import("./AgendaContent"));

export default function Page() {
  return (
    <Suspense fallback={<div><Loading/></div>}>
      <Agenda />
    </Suspense>
  );
}
