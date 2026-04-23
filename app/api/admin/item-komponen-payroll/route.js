import { NextResponse } from "next/server";

import db from "@/lib/prisma";

import {
  ALLOWED_ORDER_BY,
  ARAH_KOMPONEN_VALUES,
  CREATE_ROLES,
  DECIMAL_MAX_INTEGER_DIGITS,
  DECIMAL_SCALE,
  VIEW_ROLES,
  buildErrorResponse,
  buildSelect,
  createHttpError,
  ensureAuth,
  enrichItem,
  findDuplicateIdempotencyKey,
  guardRole,
  normalizeBoolean,
  normalizeDecimalString,
  normalizeEnum,
  normalizeNullableString,
  normalizeOptionalId,
  normalizeOptionalInt,
  normalizeOptionalUpperString,
  normalizeRequiredString,
  recalculatePayrollTotals,
  resolveItemPayload,
} from "./_shared";

function buildSearchWhere(search) {
  const normalized = String(search || "").trim();

  if (!normalized) return [];

  return [
    { nama_komponen: { contains: normalized } },
    { kunci_idempoten: { contains: normalized } },
    { catatan: { contains: normalized } },
    {
      definisi_komponen: {
        is: {
          nama_komponen: { contains: normalized },
        },
      },
    },
    {
      definisi_komponen: {
        is: {
          tipe_komponen: {
            is: {
              nama_tipe_komponen: { contains: normalized },
            },
          },
        },
      },
    },
    {
      payroll_karyawan: {
        is: {
          nama_karyawan: { contains: normalized },
        },
      },
    },
    {
      payroll_karyawan: {
        is: {
          user: {
            is: {
              nama_pengguna: { contains: normalized },
            },
          },
        },
      },
    },
    {
      payroll_karyawan: {
        is: {
          user: {
            is: {
              email: { contains: normalized },
            },
          },
        },
      },
    },
    {
      payroll_karyawan: {
        is: {
          user: {
            is: {
              nomor_induk_karyawan: { contains: normalized },
            },
          },
        },
      },
    },
    {
      pembuat: {
        is: {
          nama_pengguna: { contains: normalized },
        },
      },
    },
    {
      pembuat: {
        is: {
          email: { contains: normalized },
        },
      },
    },
  ];
}

export async function GET(req) {
  const auth = await ensureAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = guardRole(auth.actor, VIEW_ROLES);

  if (forbidden) {
    return forbidden;
  }

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || "10", 10), 1),
      100,
    );

    const search = (searchParams.get("search") || "").trim();
    const id_payroll_karyawan = (
      searchParams.get("id_payroll_karyawan") || ""
    ).trim();
    const id_periode_payroll = (
      searchParams.get("id_periode_payroll") || ""
    ).trim();
    const id_user = (searchParams.get("id_user") || "").trim();
    const id_definisi_komponen_payroll = (
      searchParams.get("id_definisi_komponen_payroll") || ""
    ).trim();
    const id_user_pembuat = (searchParams.get("id_user_pembuat") || "").trim();
    const kunci_idempoten = (searchParams.get("kunci_idempoten") || "").trim();
    const status_payroll = searchParams.get("status_payroll")
      ? normalizeOptionalUpperString(
          searchParams.get("status_payroll"),
          "status_payroll",
          50,
        )
      : undefined;

    const tipe_komponen = searchParams.get("tipe_komponen")
      ? normalizeOptionalUpperString(
          searchParams.get("tipe_komponen"),
          "tipe_komponen",
          100,
        )
      : undefined;

    const arah_komponen = searchParams.get("arah_komponen")
      ? normalizeEnum(
          searchParams.get("arah_komponen"),
          ARAH_KOMPONEN_VALUES,
          "arah_komponen",
        )
      : undefined;

    const includeDeleted = ["1", "true"].includes(
      (searchParams.get("includeDeleted") || "").toLowerCase(),
    );
    const deletedOnly = ["1", "true"].includes(
      (searchParams.get("deletedOnly") || "").toLowerCase(),
    );

    let kena_pajak;
    if (
      searchParams.get("kena_pajak") !== null &&
      searchParams.get("kena_pajak") !== ""
    ) {
      kena_pajak = normalizeBoolean(
        searchParams.get("kena_pajak"),
        "kena_pajak",
      );
    }

    const orderByParam = (
      searchParams.get("orderBy") || "urutan_tampil"
    ).trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam)
      ? orderByParam
      : "urutan_tampil";
    const sort =
      (searchParams.get("sort") || "asc").toLowerCase() === "desc"
        ? "desc"
        : "asc";

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(id_payroll_karyawan ? { id_payroll_karyawan } : {}),
      ...(id_definisi_komponen_payroll ? { id_definisi_komponen_payroll } : {}),
      ...(id_user_pembuat ? { id_user_pembuat } : {}),
      ...(kunci_idempoten ? { kunci_idempoten } : {}),
      ...(tipe_komponen ? { tipe_komponen } : {}),
      ...(arah_komponen ? { arah_komponen } : {}),
      ...(typeof kena_pajak === "boolean" ? { kena_pajak } : {}),
      ...(id_periode_payroll || id_user || status_payroll
        ? {
            payroll_karyawan: {
              is: {
                ...(id_periode_payroll ? { id_periode_payroll } : {}),
                ...(id_user ? { id_user } : {}),
                ...(status_payroll ? { status_payroll } : {}),
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: buildSearchWhere(search),
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.itemKomponenPayroll.count({ where }),
      db.itemKomponenPayroll.findMany({
        where,
        orderBy:
          orderBy === "urutan_tampil"
            ? [{ urutan_tampil: sort }, { created_at: "asc" }]
            : [
                { [orderBy]: sort },
                { urutan_tampil: "asc" },
                { created_at: "asc" },
              ],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: buildSelect(),
      }),
    ]);

    return NextResponse.json({
      data: data.map(enrichItem),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
      },
    });
  } catch (err) {
    return buildErrorResponse(err, {
      logLabel: "GET /api/admin/item-komponen-payroll error:",
    });
  }
}

export async function POST(req) {
  const auth = await ensureAuth(req);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = guardRole(auth.actor, CREATE_ROLES);

  if (forbidden) {
    return forbidden;
  }

  try {
    const body = await req.json();

    const sanitizedInput = {
      id_payroll_karyawan: normalizeRequiredString(
        body?.id_payroll_karyawan,
        "id_payroll_karyawan",
        36,
      ),
      ...(body?.id_definisi_komponen_payroll !== undefined
        ? {
            id_definisi_komponen_payroll: normalizeOptionalId(
              body?.id_definisi_komponen_payroll,
              "id_definisi_komponen_payroll",
            ),
          }
        : {}),
      ...(body?.id_user_pembuat !== undefined
        ? {
            id_user_pembuat: normalizeOptionalId(
              body?.id_user_pembuat,
              "id_user_pembuat",
            ),
          }
        : {}),
      ...(body?.kunci_idempoten !== undefined
        ? {
            kunci_idempoten: normalizeRequiredString(
              body?.kunci_idempoten,
              "kunci_idempoten",
              191,
            ),
          }
        : {}),
      ...(body?.tipe_komponen !== undefined
        ? {
            tipe_komponen: normalizeOptionalUpperString(
              body?.tipe_komponen,
              "tipe_komponen",
              100,
            ),
          }
        : {}),
      ...(body?.arah_komponen !== undefined
        ? {
            arah_komponen: normalizeEnum(
              body?.arah_komponen,
              ARAH_KOMPONEN_VALUES,
              "arah_komponen",
            ),
          }
        : {}),
      ...(body?.nama_komponen !== undefined
        ? {
            nama_komponen: normalizeNullableString(
              body?.nama_komponen,
              "nama_komponen",
              255,
            ),
          }
        : {}),
      ...(body?.nominal !== undefined
        ? {
            nominal: normalizeDecimalString(
              body?.nominal,
              "nominal",
              DECIMAL_SCALE,
              {
                min: "0",
                maxIntegerDigits: DECIMAL_MAX_INTEGER_DIGITS,
              },
            ),
          }
        : {}),
      ...(body?.kena_pajak !== undefined
        ? {
            kena_pajak: normalizeBoolean(body?.kena_pajak, "kena_pajak"),
          }
        : {}),
      ...(body?.urutan_tampil !== undefined
        ? {
            urutan_tampil: normalizeOptionalInt(
              body?.urutan_tampil,
              "urutan_tampil",
              { min: 0 },
            ),
          }
        : {}),
      ...(body?.catatan !== undefined
        ? {
            catatan: normalizeNullableString(body?.catatan, "catatan"),
          }
        : {}),
    };

    const result = await db.$transaction(async (tx) => {
      const resolved = await resolveItemPayload(
        tx,
        sanitizedInput,
        null,
        auth.actor,
      );

      const duplicate = await findDuplicateIdempotencyKey(tx, {
        kunci_idempoten: resolved.payload.kunci_idempoten,
      });

      if (duplicate) {
        throw createHttpError(409, "Kunci idempoten sudah digunakan.");
      }

      const record = await tx.itemKomponenPayroll.create({
        data: {
          ...resolved.payload,
          catatan: sanitizedInput.catatan ?? null,
        },
        select: buildSelect(),
      });

      const payroll_snapshot = await recalculatePayrollTotals(
        tx,
        resolved.payload.id_payroll_karyawan,
        {
          negativeNetMessage:
            "Perubahan item komponen payroll membuat pendapatan_bersih bernilai negatif.",
        },
      );

      return {
        data: enrichItem(record),
        payroll_snapshot,
      };
    });

    return NextResponse.json(
      {
        message: "Item komponen payroll berhasil dibuat.",
        ...result,
      },
      { status: 201 },
    );
  } catch (err) {
    return buildErrorResponse(err, {
      logLabel: "POST /api/admin/item-komponen-payroll error:",
    });
  }
}
