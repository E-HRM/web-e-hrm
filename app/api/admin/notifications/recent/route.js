import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

/**
 * Resolve the user ID from either a bearer token or the current session.
 * This helper mirrors the logic used in the main notifications endpoint to
 * ensure consistency across web and mobile clients. If authentication fails
 * the function will return a NextResponse with the appropriate status.
 *
 * @param {Request} request
 * @returns {Promise<NextResponse | { userId: string }>}
 */
async function resolveUserId(request) {
  const authHeader = request.headers.get('authorization') || '';

  // First try to extract a user ID from a bearer token. This path is
  // primarily used by our mobile clients. If the token is invalid we
  // intentionally fall through to session authentication rather than
  // immediately returning an error so that web clients can still authenticate.
  if (authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7).trim();
    try {
      const payload = verifyAuthToken(rawToken);
      const userId =
        payload?.id_user ||
        payload?.sub ||
        payload?.userId ||
        payload?.id ||
        payload?.user_id;
      if (userId) {
        return { userId };
      }
    } catch (error) {
      // Invalid bearer tokens should not cause an immediate failure; instead
      // continue to the session-based fallback. Logging is kept at warn level
      // to avoid filling logs when tokens expire.
      console.warn('Invalid bearer token for /api/notifications/recent:', error);
    }
  }

  // Fallback to session-based authentication. This will attempt to resolve
  // the current user from NextAuth or our custom session logic via
  // authenticateRequest. If that also fails we return a 401.
  const sessionOrResponse = await authenticateRequest();
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const sessionUserId =
    sessionOrResponse?.user?.id || sessionOrResponse?.user?.id_user;
  if (!sessionUserId) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  return { userId: sessionUserId };
}

/**
 * GET /api/notifications/recent
 *
 * Returns notifications for the authenticated user that were created
 * within a specified number of days. Optionally filters by one or more
 * related table names (e.g. pengajuan_cuti, pengajuan_izin_sakit).
 *
 * Query parameters:
 * - days (number): How many days back to include (default 7, min 1, max 30)
 * - types (string): Comma-separated list of related_table names to include
 *   (e.g. "pengajuan_cuti,izin_tukar_hari"). If omitted all types are returned.
 */
export async function GET(request) {
  const authResult = await resolveUserId(request);
  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    // Parse the `days` parameter. Default to 7 if not provided. Clamp
    // between 1 and 30 to avoid excessive queries.
    const rawDays = parseInt(searchParams.get('days') || '7', 10);
    const days = Number.isNaN(rawDays)
      ? 7
      : Math.min(Math.max(rawDays, 1), 30);

    // Calculate the cutoff timestamp. Notifications created on or after
    // this date will be included in the result set. Using UTC dates for
    // consistency regardless of server timezone.
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Optional filtering by related_table. The `types` parameter should
    // contain a comma-separated list of table names. Empty values are
    // ignored. All comparisons are case-sensitive to match the stored values.
    const typesParam = (searchParams.get('types') || '').trim();
    const typeList = typesParam
      ? typesParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const where = {
      id_user: userId,
      deleted_at: null,
      created_at: { gte: cutoff },
    };
    // If specific types were provided, add an additional filter. The
    // `related_table` column is nullable, so we only include it when
    // filtering; otherwise all notifications are returned.
    if (typeList.length > 0) {
      where.related_table = { in: typeList };
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 200, // Limit to 200 records to prevent overwhelming clients
    });

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error('Failed to fetch recent notifications:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}