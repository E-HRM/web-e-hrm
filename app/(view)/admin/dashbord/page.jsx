"use client";

import { Suspense, lazy } from "react";

<<<<<<< HEAD
const Dashboard = lazy(() => import("./"));
=======
const Dashboard = lazy(() => import("./dashboard"));
>>>>>>> origin/branch-ode

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
