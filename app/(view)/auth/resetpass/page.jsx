"use client";

import { Suspense, lazy } from "react";

const ResetPassword = lazy(() => import("./ResetPasswordContent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
