"use client";

import { Suspense, lazy } from "react";
import Loading from "../../../../components/common/Loading";


const Agenda = lazy(() => import("./AgendaCalendarContent"));

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Agenda />
    </Suspense>
  );
}
