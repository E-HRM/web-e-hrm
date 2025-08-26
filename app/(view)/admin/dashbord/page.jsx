"use client";

import { Suspense, lazy } from "react";

<<<<<<< HEAD
const Dashboard = lazy(() => import("./"));
=======
const Dashboard = lazy(() => import("./dashboard"));
>>>>>>> ae27c2cdb1fc0f00b1f904650ce3e062226ef4d3

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
