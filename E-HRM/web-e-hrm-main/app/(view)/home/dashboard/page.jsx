"use client";

import Image from "next/image";
import { LogoutOutlined } from "@ant-design/icons";
import Sidebar from "../../../components/dashboard/Sidebar";
import StatCard from "../../../components/dashboard/StatCard";
import MiniStat from "../../../components/dashboard/MiniStat";
import LeaveListCard from "../../../components/dashboard/LeaveListCard";
import useDashboardViewModel from "./useDashboardViewModel";
import useLogoutViewModel from "../../auth/logout/useLogoutViewModel";

export default function DashboardPage() {
  const { today, userName, statSummary, miniStats, leaveList } = useDashboardViewModel();
  const { onLogout } = useLogoutViewModel();

  return (
    <div className="min-h-dvh bg-[#F6F7F9]">
      <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
        <Sidebar />

        <main className="min-h-dvh px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-medium text-gray-900">Home</h1>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Admin</span>

              <Image
                src="/logo-burung.png"
                width={32}
                height={32}
                className="rounded-full ring-1 ring-gray-200"
                priority
              />

              <button
                onClick={onLogout}
                aria-label="Logout"
                title="Logout"
                className="grid place-items-center rounded-md p-1 hover:bg-red-50 transition"
              >
                <LogoutOutlined className="text-red-600 text-xl" />
              </button>
            </div>
          </div>

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

          <section className="mt-6">
            <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-4 md:p-5">
              <p className="text-sm text-gray-500">Akumulasi Keterlambatan (grafik menyusul)</p>
              <div className="h-52 grid place-items-center text-gray-400 text-sm">
                Coming soon…
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
