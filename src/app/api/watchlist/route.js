import { NextResponse } from "next/server";
import { getDb, getUserFromRequest, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  await initDb();
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ watchlist: [] });
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM watchlist WHERE user_id = ? ORDER BY created_at DESC",
    args: [user.id],
  });
  return NextResponse.json({ watchlist: result.rows });
}

export async function POST(request) {
  await initDb();
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { anime_id, anime_name, poster, type, anilist_id } = await request.json();
  if (!anime_id) return NextResponse.json({ error: "anime_id required" }, { status: 400 });

  const db = getDb();
  await db.execute({
    sql: `INSERT INTO watchlist (user_id, anime_id, anime_name, poster, type, anilist_id)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, anime_id) DO UPDATE SET
          type = excluded.type,
          anime_name = excluded.anime_name,
          poster = excluded.poster`,
    args: [user.id, String(anime_id), anime_name || "", poster || null, type || "watching", anilist_id || null],
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  await initDb();
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const anime_id = searchParams.get("anime_id");
  if (!anime_id) return NextResponse.json({ error: "anime_id required" }, { status: 400 });
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM watchlist WHERE user_id = ? AND anime_id = ?",
    args: [user.id, String(anime_id)],
  });
  return NextResponse.json({ success: true });
}
