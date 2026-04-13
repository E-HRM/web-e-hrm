"use client";

import LoadingSplash from "@/app/(view)/component_shared/LoadingSplash";
import { Suspense, lazy } from "react";

const LazyFreelanceComponent = lazy(() => import("./FreelanceComponent"));

export default function Freelance() {
  return (
    <Suspense
      fallback={
        <LoadingSplash
          label="Memuat Freelance..."
          brand="#003A6F"
          size={124}
          fullscreen={false}
        />
      }
    >
      <LazyFreelanceComponent />
    </Suspense>
  );
}
