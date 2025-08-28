"use client";

import StatCard from "../../../components/dashboard/StatCard";
import MiniStat from "../../../components/dashboard/MiniStat";
import LeaveListCard from "../../../components/dashboard/LeaveListCard";


import useDashboardViewModel from "./useDashboardViewModel";

export default function DashboardPage() {
  const { today, userName, statSummary, miniStats, leaveList } = useDashboardViewModel();

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold">Hello, {userName}!</p>
                <p className="text-sm text-gray-500">{today}</p>
              </div>
              <div className="hidden md:block size-10 rounded-full bg-emerald-50 ring-1 ring-emerald-100" />
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {statSummary.map((s) => (
                <StatCard key={s.key} {...s} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {miniStats.map((m) => (
              <MiniStat key={m.key} label={m.label} value={m.value} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <LeaveListCard items={leaveList} />
        </div>
      </section>

      {/* SECTION: Placeholder chart */}
      <section className="mt-6">
        <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-4 md:p-5">
          <p className="text-sm text-gray-500">Akumulasi Keterlambatan (grafik menyusul)</p>
          <div className="h-52 grid place-items-center text-gray-400 text-sm">
            Coming soon…
          </div>
        </div>
      </section>
    </>
  );
}
