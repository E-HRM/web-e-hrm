import { NextResponse } from 'next/server';

const payload = {
  message: 'Approval payroll per periode sudah tidak digunakan. Gunakan approval pada payroll karyawan melalui /api/admin/payroll-karyawan.',
  replacement_endpoint: '/api/admin/payroll-karyawan',
};

export async function GET() {
  return NextResponse.json(payload, { status: 410 });
}

export async function POST() {
  return NextResponse.json(payload, { status: 410 });
}
