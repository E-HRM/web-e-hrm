export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import {
  buildPlanInclude,
  getAdminActor,
  getPlanUserSnapshot,
  isKpiStorageUnavailableError,
  parsePlanPayload,
  replacePlanItems,
  serializePlan,
} from '../_utils';

export async function GET(request, { params }) {
  const actor = await getAdminActor(request);
  if (actor instanceof NextResponse) return actor;

  try {
    const plan = await db.kPIPlan.findFirst({
      where: {
        id_kpi_plan: params.id,
        deleted_at: null,
      },
      include: buildPlanInclude(),
    });

    if (!plan) {
      return NextResponse.json({ message: 'KPI plan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data: serializePlan(plan) });
  } catch (error) {
    console.error('GET /api/admin/kpi-plans/[id] error:', error);
    if (isKpiStorageUnavailableError(error)) {
      return NextResponse.json({ message: 'Storage KPI belum tersedia di database.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Gagal memuat detail KPI plan.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const actor = await getAdminActor(request);
  if (actor instanceof NextResponse) return actor;

  try {
    const existing = await db.kPIPlan.findFirst({
      where: {
        id_kpi_plan: params.id,
        deleted_at: null,
      },
      select: {
        id_kpi_plan: true,
        id_user: true,
        tahun: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'KPI plan tidak ditemukan.' }, { status: 404 });
    }

    const payload = await parsePlanPayload(request);
    const snapshot = await getPlanUserSnapshot(payload.userId);

    const duplicate = await db.kPIPlan.findFirst({
      where: {
        id_user: payload.userId,
        tahun: payload.tahun,
        deleted_at: null,
        NOT: {
          id_kpi_plan: params.id,
        },
      },
      select: {
        id_kpi_plan: true,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: 'Plan KPI untuk karyawan dan tahun tersebut sudah ada.', data: { id: duplicate.id_kpi_plan } },
        { status: 409 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.kPIPlan.update({
        where: {
          id_kpi_plan: params.id,
        },
        data: {
          id_user: snapshot.userId,
          id_jabatan: snapshot.jabatanId,
          id_location: snapshot.locationId,
          tahun: payload.tahun,
          status: payload.status,
          nama_user_snapshot: snapshot.namaKaryawan,
          jabatan_snapshot: snapshot.jabatanNama,
          location_snapshot: snapshot.locationNama,
        },
      });

      await replacePlanItems(tx, params.id, payload.items);
    });

    const updated = await db.kPIPlan.findUnique({
      where: {
        id_kpi_plan: params.id,
      },
      include: buildPlanInclude(),
    });

    return NextResponse.json({ data: serializePlan(updated) });
  } catch (error) {
    console.error('PUT /api/admin/kpi-plans/[id] error:', error);
    if (isKpiStorageUnavailableError(error)) {
      return NextResponse.json(
        { message: 'Tabel KPI belum tersedia di database. Jalankan migration Prisma terlebih dahulu.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ message: error.message || 'Gagal memperbarui KPI plan.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const actor = await getAdminActor(request);
  if (actor instanceof NextResponse) return actor;

  try {
    const existing = await db.kPIPlan.findFirst({
      where: {
        id_kpi_plan: params.id,
        deleted_at: null,
      },
      select: {
        id_kpi_plan: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'KPI plan tidak ditemukan.' }, { status: 404 });
    }

    await db.kPIPlan.delete({
      where: {
        id_kpi_plan: params.id,
      },
    });

    return NextResponse.json({ message: 'KPI plan berhasil dihapus.' });
  } catch (error) {
    console.error('DELETE /api/admin/kpi-plans/[id] error:', error);
    if (isKpiStorageUnavailableError(error)) {
      return NextResponse.json(
        { message: 'Tabel KPI belum tersedia di database. Jalankan migration Prisma terlebih dahulu.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ message: 'Gagal menghapus KPI plan.' }, { status: 500 });
  }
}
