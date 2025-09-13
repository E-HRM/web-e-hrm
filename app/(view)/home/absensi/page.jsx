import { Suspense, lazy } from "react";
import { Spin } from "antd";

const Abse = lazy(() => import("./AbsensiContent"));

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <Spin size="large" />
        </div>
      }
    >
      <Abse />
    </Suspense>
  );
}
