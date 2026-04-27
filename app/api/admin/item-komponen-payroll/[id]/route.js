import { NextResponse } from 'next/server';

import db from '@/lib/prisma';

import { resolveCicilanIdFromPayrollItemKey, unpostCicilanPayrollPosting } from '../../cicilan-pinjaman-karyawan/payrollPosting.shared';
import { unpostPayoutPayrollPosting } from '../../payout-konsultan/_helper';
import {
  ARAH_KOMPONEN_VALUES,
  DECIMAL_MAX_INTEGER_DIGITS,
  DECIMAL_SCALE,
  DELETE_ROLES,
  EDIT_ROLES,
  VIEW_ROLES,
  buildErrorResponse,
  buildSelect,
  createHttpError,
  ensureAuth,
  ensureNonDerivedTaxItem,
  ensurePayrollEditable,
  enrichItem,
  findDuplicateIdempotencyKey,
  getExistingItem,
  guardRole,
  normalizeDecimalString,
  normalizeEnum,
  normalizeNullableString,
  normalizeOptionalId,
  normalizeOptionalInt,
  normalizeOptionalUpperString,
  normalizeRequiredString,
  recalculatePayrollTotals,
  resolveItemPayload,
} from '../_shared';

function resolvePostingSource(kunci_idempoten) {
  const normalized = String(kunci_idempoten || '').trim();
  const payoutPrefix = 'payout-konsultan:';
  const cicilanId = resolveCicilanIdFromPayrollItemKey(normalized);

  if (normalized.startsWith(payoutPrefix)) {
    const id = normalized.slice(payoutPrefix.length).trim();
    return id ? { type: 'payout_konsultan', id } : null;
  }

  if (cicilanId) {
    return { type: 'cicilan_pinjaman', id: cicilanId };
  }

  return null;
}

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = guardRole(auth.actor, VIEW_ROLES);

  if (forbidden) {
    return forbidden;
  }

  try {
    const { id } = params;

    const data = await db.itemKomponenPayroll.findUnique({
      where: {
        id_item_komponen_payroll: id,
      },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Item komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      data: enrichItem(data),
    });
  } catch (err) {
    return buildErrorResponse(err, {
      logLabel: 'GET /api/admin/item-komponen-payroll/[id] error:',
    });
  }
}

export async function PUT(req, { params }) {
  const auth = await ensureAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = guardRole(auth.actor, EDIT_ROLES);

  if (forbidden) {
    return forbidden;
  }

  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const restore = ['1', 'true'].includes((searchParams.get('restore') || '').toLowerCase());
    const body = await req.json();

    const existing = await getExistingItem(id);

    if (!existing) {
      return NextResponse.json({ message: 'Item komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    if (existing.deleted_at && !restore) {
      return NextResponse.json(
        {
          message: 'Item komponen payroll sudah dihapus. Gunakan ?restore=true jika ingin memulihkan sambil memperbarui.',
        },
        { status: 409 },
      );
    }

    ensureNonDerivedTaxItem(existing, 'diubah');

    const sanitizedInput = {
      ...(body?.id_payroll_karyawan !== undefined
        ? {
            id_payroll_karyawan: normalizeRequiredString(body?.id_payroll_karyawan, 'id_payroll_karyawan', 36),
          }
        : {}),
      ...(body?.id_definisi_komponen_payroll !== undefined
        ? {
            id_definisi_komponen_payroll: normalizeOptionalId(body?.id_definisi_komponen_payroll, 'id_definisi_komponen_payroll'),
          }
        : {}),
      ...(body?.id_user_pembuat !== undefined
        ? {
            id_user_pembuat: normalizeOptionalId(body?.id_user_pembuat, 'id_user_pembuat'),
          }
        : {}),
      ...(body?.kunci_idempoten !== undefined
        ? {
            kunci_idempoten: normalizeRequiredString(body?.kunci_idempoten, 'kunci_idempoten', 191),
          }
        : {}),
      ...(body?.tipe_komponen !== undefined
        ? {
            tipe_komponen: normalizeOptionalUpperString(body?.tipe_komponen, 'tipe_komponen', 100),
          }
        : {}),
      ...(body?.arah_komponen !== undefined
        ? {
            arah_komponen: normalizeEnum(body?.arah_komponen, ARAH_KOMPONEN_VALUES, 'arah_komponen'),
          }
        : {}),
      ...(body?.nama_komponen !== undefined
        ? {
            nama_komponen: normalizeNullableString(body?.nama_komponen, 'nama_komponen', 255),
          }
        : {}),
      ...(body?.nominal !== undefined
        ? {
            nominal: normalizeDecimalString(body?.nominal, 'nominal', DECIMAL_SCALE, {
              min: '0',
              maxIntegerDigits: DECIMAL_MAX_INTEGER_DIGITS,
            }),
          }
        : {}),
      ...(body?.urutan_tampil !== undefined
        ? {
            urutan_tampil: normalizeOptionalInt(body?.urutan_tampil, 'urutan_tampil', { min: 0 }),
          }
        : {}),
      ...(body?.catatan !== undefined
        ? {
            catatan: normalizeNullableString(body?.catatan, 'catatan'),
          }
        : {}),
    };

    if (Object.keys(sanitizedInput).length === 0 && !restore) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const resolved = await resolveItemPayload(tx, sanitizedInput, existing, auth.actor);

      const duplicate = await findDuplicateIdempotencyKey(tx, {
        kunci_idempoten: resolved.payload.kunci_idempoten,
        excludeId: id,
      });

      if (duplicate) {
        throw createHttpError(409, 'Kunci idempoten sudah digunakan.');
      }

      const record = await tx.itemKomponenPayroll.update({
        where: {
          id_item_komponen_payroll: id,
        },
        data: {
          ...resolved.payload,
          ...(Object.prototype.hasOwnProperty.call(sanitizedInput, 'catatan')
            ? {
                catatan: sanitizedInput.catatan,
              }
            : {}),
          ...(restore
            ? {
                deleted_at: null,
              }
            : {}),
        },
        select: buildSelect(),
      });

      const payrollIds = Array.from(new Set([existing.id_payroll_karyawan, resolved.payload.id_payroll_karyawan].filter(Boolean)));

      const payroll_snapshots = {};

      for (const payrollId of payrollIds) {
        payroll_snapshots[payrollId] = await recalculatePayrollTotals(tx, payrollId, {
          negativeNetMessage: 'Perubahan item komponen payroll membuat pendapatan_bersih bernilai negatif.',
        });
      }

      return {
        data: enrichItem(record),
        payroll_snapshots,
      };
    });

    return NextResponse.json({
      message: restore ? 'Item komponen payroll berhasil dipulihkan dan diperbarui.' : 'Item komponen payroll berhasil diperbarui.',
      ...result,
    });
  } catch (err) {
    return buildErrorResponse(err, {
      logLabel: 'PUT /api/admin/item-komponen-payroll/[id] error:',
    });
  }
}

export async function DELETE(req, { params }) {
  const auth = await ensureAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = guardRole(auth.actor, DELETE_ROLES);

  if (forbidden) {
    return forbidden;
  }

  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);

    const hardDelete = ['1', 'true'].includes((searchParams.get('hard') || '').toLowerCase());

    const existing = await getExistingItem(id);

    if (!existing) {
      return NextResponse.json({ message: 'Item komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json(
          {
            message: 'Item komponen payroll sudah dihapus sebelumnya.',
            mode: 'soft',
          },
          { status: 409 },
        );
      }

      ensureNonDerivedTaxItem(existing, 'dihapus');

      const result = await db.$transaction(async (tx) => {
        await ensurePayrollEditable(tx, existing.id_payroll_karyawan);

        const postingSource = resolvePostingSource(existing.kunci_idempoten);

        if (postingSource?.type === 'payout_konsultan') {
          const unpostResult = await unpostPayoutPayrollPosting(tx, postingSource.id);
          const deleted = await tx.itemKomponenPayroll.findUnique({
            where: {
              id_item_komponen_payroll: id,
            },
            select: buildSelect(),
          });

          return {
            data: enrichItem(deleted),
            source_unpost_summary: {
              type: postingSource.type,
              payout: unpostResult.data,
              payroll_items_soft_deleted: unpostResult.detachSummary.item ? 1 : 0,
              payroll_snapshots: unpostResult.detachSummary.payrolls,
              transaksi_dilepas_dari_posting: unpostResult.transaksiReleased,
            },
          };
        }

        if (postingSource?.type === 'cicilan_pinjaman') {
          const unpostResult = await unpostCicilanPayrollPosting(tx, postingSource.id, {
            payrollItemId: id,
            requirePosted: true,
          });
          const deleted = await tx.itemKomponenPayroll.findUnique({
            where: {
              id_item_komponen_payroll: id,
            },
            select: buildSelect(),
          });

          return {
            data: enrichItem(deleted),
            source_unpost_summary: {
              type: postingSource.type,
              cicilan: unpostResult.cicilan,
              item_komponen_payroll: unpostResult.item,
              loan_snapshot: unpostResult.loan_snapshot,
              payroll_snapshots: unpostResult.payrolls,
            },
          };
        }

        const deleted = await tx.itemKomponenPayroll.update({
          where: {
            id_item_komponen_payroll: id,
          },
          data: {
            deleted_at: new Date(),
          },
          select: buildSelect(),
        });

        const payroll_snapshot = await recalculatePayrollTotals(tx, existing.id_payroll_karyawan, {
          negativeNetMessage: 'Perubahan item komponen payroll membuat pendapatan_bersih bernilai negatif.',
        });

        return {
          data: enrichItem(deleted),
          payroll_snapshot,
        };
      });

      return NextResponse.json({
        message: 'Item komponen payroll berhasil dihapus',
        mode: 'soft',
        ...result,
      });
    }

    if (existing.deleted_at) {
      ensureNonDerivedTaxItem(existing, 'dihapus');

      await db.itemKomponenPayroll.delete({
        where: {
          id_item_komponen_payroll: id,
        },
      });

      return NextResponse.json({
        message: 'Item komponen payroll berhasil dihapus permanen.',
        mode: 'hard',
      });
    }

    ensureNonDerivedTaxItem(existing, 'dihapus');

    const result = await db.$transaction(async (tx) => {
      await ensurePayrollEditable(tx, existing.id_payroll_karyawan);

      await tx.itemKomponenPayroll.delete({
        where: {
          id_item_komponen_payroll: id,
        },
      });

      const payroll_snapshot = await recalculatePayrollTotals(tx, existing.id_payroll_karyawan, {
        negativeNetMessage: 'Perubahan item komponen payroll membuat pendapatan_bersih bernilai negatif.',
      });

      return { payroll_snapshot };
    });

    return NextResponse.json({
      message: 'Item komponen payroll berhasil dihapus permanen.',
      mode: 'hard',
      ...result,
    });
  } catch (err) {
    return buildErrorResponse(err, {
      logLabel: 'DELETE /api/admin/item-komponen-payroll/[id] error:',
    });
  }
}
