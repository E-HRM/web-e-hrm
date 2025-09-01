"use client";

import useSWR from "swr";
import { fetcher } from "../../../utils/fetcher";
import { ApiEndpoints } from "../../../../constrainst/endpoints";
import DivisionCard from "../../../components/card/DivisionCard";

export default function ShiftDivisionsPage() {
  const { data } = useSWR(`${ApiEndpoints.GetDepartement}?page=1&pageSize=100`, fetcher);
  const divisions = (data?.data || []).map((r, i) => ({
    id: r.id_departement,
    name: r.nama_departement,
    align: i % 2 === 0 ? "left" : "right",
    count: 0,
  }));

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Penjadwalan Shift</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {divisions.map((d) => (
          <DivisionCard
            key={d.id}
            name={d.name}
            count={d.count}
            align={d.align}
            readonly
            href={`/home/karyawan/shift/${d.id}`} 
          />
        ))}
      </div>
    </div>
  );
}
