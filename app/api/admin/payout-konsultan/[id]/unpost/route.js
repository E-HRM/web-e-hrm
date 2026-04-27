import { NextResponse } from "next/server";

import db from "@/lib/prisma";

import {
  EDIT_ROLES,
  STATUS_PERIODE_KONSULTAN_TERKUNCI,
  buildPayoutUnpostState,
  buildSelect,
  detachPayrollItemForPayout,
  ensureAuth,
  enrichPayout,
  getExistingPayout,
  guardRole,
  setTransaksiPostingStatusByPayout,
} from "../../_helper";

function isPayoutPosted(payout) {
  return (
    payout?.status_payout === "DIPOSTING_KE_PAYROLL" ||
    Boolean(payout?.diposting_pada)
  );
}

export async function POST(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, EDIT_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;
    const existing = await getExistingPayout(id, {
      includeDetails: true,
      client: db,
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Payout konsultan tidak ditemukan." },
        { status: 404 },
      );
    }

    if (existing.deleted_at) {
      return NextResponse.json(
        { message: "Payout konsultan ini sudah dihapus." },
        { status: 409 },
      );
    }

    if (existing.periode_konsultan?.deleted_at) {
      return NextResponse.json(
        { message: "Periode konsultan payout ini sudah dihapus." },
        { status: 409 },
      );
    }

    if (
      existing.periode_konsultan?.status_periode ===
      STATUS_PERIODE_KONSULTAN_TERKUNCI
    ) {
      return NextResponse.json(
        { message: "Periode konsultan payout ini sudah terkunci." },
        { status: 409 },
      );
    }

    if (!isPayoutPosted(existing)) {
      return NextResponse.json(
        {
          message:
            "Payout konsultan ini belum diposting ke payroll, sehingga tidak perlu dilepas posting.",
        },
        { status: 409 },
      );
    }

    if (!existing.id_periode_payroll) {
      return NextResponse.json(
        {
          message:
            "Payout konsultan ini tidak memiliki relasi periode payroll aktif untuk dilepas posting.",
        },
        { status: 409 },
      );
    }

    const result = await db.$transaction(async (tx) => {
      const detachSummary = await detachPayrollItemForPayout(tx, existing);
      const transaksiReleased = await setTransaksiPostingStatusByPayout(
        tx,
        id,
        false,
      );

      await tx.payoutKonsultan.update({
        where: {
          id_payout_konsultan: id,
        },
        data: buildPayoutUnpostState(),
      });

      const refreshed = await tx.payoutKonsultan.findUnique({
        where: {
          id_payout_konsultan: id,
        },
        select: buildSelect({ includeDetails: true }),
      });

      return {
        data: enrichPayout(refreshed),
        detachSummary,
        transaksiReleased,
      };
    });

    return NextResponse.json({
      message:
        "Posting payout konsultan berhasil dilepas. Payout dikembalikan ke draft dan dapat diedit kembali.",
      data: result.data,
      unpost_summary: {
        payroll_items_soft_deleted: result.detachSummary.item ? 1 : 0,
        payroll_snapshots: result.detachSummary.payrolls,
        transaksi_dilepas_dari_posting: result.transaksiReleased,
      },
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes("Payroll") ||
        err.message.includes("payroll") ||
        err.message.includes("terkunci") ||
        err.message.includes("dihapus") ||
        err.message.includes("diposting"))
    ) {
      return NextResponse.json({ message: err.message }, { status: 409 });
    }

    console.error("POST /api/admin/payout-konsultan/[id]/unpost error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
