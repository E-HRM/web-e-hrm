"use client";

import { Suspense, lazy } from "react";

const Login = lazy(() => import("./LoginContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login />
    </Suspense>
  );
}
