"use client";

import { Suspense, lazy } from "react";

const Dashboard = lazy(() => import("./DashboardContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
