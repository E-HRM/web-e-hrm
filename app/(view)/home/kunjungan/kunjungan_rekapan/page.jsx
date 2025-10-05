"use client";

import { Suspense, lazy } from "react";
import KunjunganContent from "./KunjunganRekapanContent";
import LoadingSplash from "@/app/components/common/LoadingSplash";


const KunjunganRekapanContent = lazy(() => import("./KunjunganRekapanContent"));

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
      <KunjunganRekapanContent/>
    </Suspense>
  );
}
