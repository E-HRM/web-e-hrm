import { NextResponse } from 'next/server';

import db from '@/lib/prisma';

import { buildSlipPayload, buildSlipSelect, ensureAuth, guardRole, VIEW_ROLES } from '../../payrollKaryawan.shared';

function classifyTemplate(template) {
  const templateName = String(template?.nama_template || '')
    .trim()
    .toLowerCase();

  if (templateName.includes('header') || templateName.includes('kepala')) {
    return 'header';
  }

  if (templateName.includes('footer') || templateName.includes('kaki')) {
    return 'footer';
  }

  return 'other';
}

function normalizeTemplate(template) {
  if (!template) return null;

  return {
    id_master_template: template.id_master_template,
    nama_template: template.nama_template,
    file_template_url: template.file_template_url,
    role: classifyTemplate(template),
    created_at: template.created_at,
    updated_at: template.updated_at,
  };
}

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const [payroll, templates] = await Promise.all([
      db.payrollKaryawan.findUnique({
        where: {
          id_payroll_karyawan: id,
        },
        select: buildSlipSelect(),
      }),
      db.masterTemplate.findMany({
        where: {
          deleted_at: null,
        },
        orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
        select: {
          id_master_template: true,
          nama_template: true,
          file_template_url: true,
          created_at: true,
          updated_at: true,
        },
      }),
    ]);

    if (!payroll || payroll.deleted_at) {
      return NextResponse.json({ message: 'Slip payroll karyawan tidak ditemukan.' }, { status: 404 });
    }

    const normalizedTemplates = templates.map(normalizeTemplate).filter(Boolean);

    return NextResponse.json({
      data: {
        ...buildSlipPayload(payroll),
        templates: {
          header: normalizedTemplates.find((template) => template.role === 'header') || null,
          footer: normalizedTemplates.find((template) => template.role === 'footer') || null,
          items: normalizedTemplates,
        },
      },
    });
  } catch (err) {
    console.error('GET /api/admin/payroll-karyawan/[id]/slip error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
