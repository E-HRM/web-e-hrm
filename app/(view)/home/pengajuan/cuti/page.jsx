"use client";

import { Suspense, lazy } from "react";

const Cuti = lazy(() => import("./CutiContent"));
import LoadingSplash from "@/app/components/common/LoadingSplash";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center min-h-[calc(100dvh-64px-56px)]">
          <LoadingSplash
            label="Menyiapkan Halaman…"
            brand="#003A6F"
            size={124}
            fullscreen={false}   
          />
        </div>
      }
    >
      <Cuti />
    </Suspense>
  );
}
