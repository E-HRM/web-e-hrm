"use client";

import { Suspense, lazy } from "react";
import ApproveAbsensiContent from "./ApproveAbsensiContent";


const Agenda = lazy(() => import("./ApproveAbsensiContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApproveAbsensiContent />
    </Suspense>
  );
}
