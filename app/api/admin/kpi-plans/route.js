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
} from './_utils';

export async function GET(request) {
  const actor = await getAdminActor(request);
  if (actor instanceof NextResponse) return actor;

  let page = 1;
  let pageSize = 10;

  try {
    const { searchParams } = new URL(request.url);
    page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);
    const userId = String(searchParams.get('userId') || '').trim();
    const status = String(searchParams.get('status') || '').trim().toLowerCase();
    const tahunParam = String(searchParams.get('tahun') || '').trim();
    const search = String(searchParams.get('search') || '').trim();
    const includeDeleted = searchParams.get('includeDeleted') === '1';

    const tahun = tahunParam ? parseInt(tahunParam, 10) : null;

    const where = {
      ...(includeDeleted ? {} : { deleted_at: null }),
      ...(userId ? { id_user: userId } : {}),
      ...(Number.isInteger(tahun) ? { tahun } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { nama_user_snapshot: { contains: search } },
              { jabatan_snapshot: { contains: search } },
              { location_snapshot: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      db.kPIPlan.count({ where }),
      db.kPIPlan.findMany({
        where,
        orderBy: [
          { tahun: 'desc' },
          { updated_at: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: buildPlanInclude(),
      }),
    ]);

    return NextResponse.json({
      data: rows.map(serializePlan),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/admin/kpi-plans error:', error);
    if (isKpiStorageUnavailableError(error)) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
        warning: 'Storage KPI belum tersedia penuh di database. Jalankan migration Prisma untuk mengaktifkan data KPI.',
      });
    }
    return NextResponse.json({ message: 'Gagal memuat data KPI plan.' }, { status: 500 });
  }
}

export async function POST(request) {
  const actor = await getAdminActor(request);
  if (actor instanceof NextResponse) return actor;

  try {
    const payload = await parsePlanPayload(request);
    const snapshot = await getPlanUserSnapshot(payload.userId);

    const existing = await db.kPIPlan.findFirst({
      where: {
        id_user: payload.userId,
        tahun: payload.tahun,
        deleted_at: null,
      },
      select: {
        id_kpi_plan: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Plan KPI untuk karyawan dan tahun tersebut sudah ada.', data: { id: existing.id_kpi_plan } },
        { status: 409 }
      );
    }

    const createdPlanId = await db.$transaction(async (tx) => {
      const createdPlan = await tx.kPIPlan.create({
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
        select: {
          id_kpi_plan: true,
        },
      });

      await replacePlanItems(tx, createdPlan.id_kpi_plan, payload.items);
      return createdPlan.id_kpi_plan;
    });

    const created = await db.kPIPlan.findUnique({
      where: {
        id_kpi_plan: createdPlanId,
      },
      include: buildPlanInclude(),
    });

    return NextResponse.json({ data: serializePlan(created) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/kpi-plans error:', error);
    if (isKpiStorageUnavailableError(error)) {
      return NextResponse.json(
        { message: 'Tabel KPI belum tersedia di database. Jalankan migration Prisma terlebih dahulu.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ message: error.message || 'Gagal membuat KPI plan.' }, { status: 400 });
  }
}
