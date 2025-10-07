"use client";

import { Suspense, lazy } from "react";

const Departement = lazy(() => import("./DepartementContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Departement />
    </Suspense>
  );
}
