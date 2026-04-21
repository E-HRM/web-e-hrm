import { redirect } from 'next/navigation';

export default function Page({ searchParams }) {
  const query = new URLSearchParams();

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) query.append(key, item);
      });
      return;
    }

    if (value) {
      query.set(key, value);
    }
  });

  const href = query.toString() ? `/home/payroll/penggajian/payroll-karyawan?${query.toString()}` : '/home/payroll/penggajian/payroll-karyawan';
  redirect(href);
}
