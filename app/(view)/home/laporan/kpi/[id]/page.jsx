"use client";

import { Suspense, lazy } from "react";
import LoadingSplash from "@/app/(view)/component_shared/LoadingSplash";

const Component = lazy(() => import("./DetailKpiComponent"));

export default function Page({ params }) {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center min-h-[calc(100dvh-64px-56px)]">
          <LoadingSplash
            label="Menyiapkan Detail KPI..."
            brand="#0F766E"
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <Component userId={params?.id} />
    </Suspense>
  );
}
