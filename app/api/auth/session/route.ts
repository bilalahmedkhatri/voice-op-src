import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Fetch user quota from DB
    let quota = null;
    const sql = getDb();
    if (sql) {
      const quotaRows = await sql`
        SELECT generations_used, max_daily_generations, max_chars_per_request, chars_used_today, max_daily_chars, reset_at
        FROM user_quotas
        WHERE user_id = ${user.id}
        LIMIT 1
      `;
      if (quotaRows && quotaRows.length > 0) {
        quota = quotaRows[0];
      }
    }

    return NextResponse.json({
      authenticated: true,
      user,
      quota,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
