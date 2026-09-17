import { NextResponse } from "next/server";
import { getDb, getUserFromRequest, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  await initDb();
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ history: [] });
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM watch_history WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20",
    args: [user.id],
  });
  return NextResponse.json({ history: result.rows });
}

export async function POST(request) {
  await initDb();
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { anime_id, anime_name, poster, anilist_id, episode_number, finished, seconds_watched } = await request.json();

  // Only save to history if watched at least 10 seconds OR it's a finished signal
  if (!finished && (!seconds_watched || seconds_watched < 10)) {
    return NextResponse.json({ success: true, skipped: true });
  }

  const db = getDb();

  await db.execute({
    sql: `INSERT INTO watch_history (user_id, anime_id, anime_name, poster, anilist_id, episode_number, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(user_id, anime_id) DO UPDATE SET
          episode_number = excluded.episode_number,
          updated_at = datetime('now')`,
    args: [user.id, String(anime_id), anime_name || "", poster || null, anilist_id || null, episode_number || 1],
  });

  // Only update streak and count when episode is actually finished
  if (!finished) return NextResponse.json({ success: true });

  const today = new Date().toISOString().slice(0, 10);
  const userResult = await db.execute({
    sql: "SELECT streak, last_watch_date, total_watched FROM users WHERE id = ?",
    args: [user.id],
  });
  const u    = userResult.rows[0];
  const last = u?.last_watch_date;
  let streak = Number(u?.streak) || 0;
  let total  = (Number(u?.total_watched) || 0) + 1;

  if (last !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = last === yesterday ? streak + 1 : 1;
  }

  await db.execute({
    sql: "UPDATE users SET streak = ?, last_watch_date = ?, total_watched = ? WHERE id = ?",
    args: [streak, today, total, user.id],
  });

  const checks = [
    { type: "first_watch",  condition: total >= 1   },
    { type: "watched_10",   condition: total >= 10  },
    { type: "watched_50",   condition: total >= 50  },
    { type: "watched_100",  condition: total >= 100 },
    { type: "streak_3",     condition: streak >= 3  },
    { type: "streak_7",     condition: streak >= 7  },
    { type: "streak_30",    condition: streak >= 30 },
  ];
  for (const { type, condition } of checks) {
    if (condition) {
      await db.execute({
        sql: "INSERT OR IGNORE INTO achievements (user_id, type) VALUES (?, ?)",
        args: [user.id, type],
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, streak, total });
}
