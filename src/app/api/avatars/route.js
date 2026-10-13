import { NextResponse } from "next/server";
import { getAvatarCharacters } from "@/lib/anilist";
import { getCachedAsync, setCachedAsync } from "@/lib/cache";

const CACHE_KEY = "avatar_characters_v1";
const CACHE_TTL = 60 * 60 * 12; // 12h — this list barely changes

export async function GET() {
  try {
    const cached = await getCachedAsync(CACHE_KEY);
    if (cached) return NextResponse.json({ avatars: cached });

    const avatars = await getAvatarCharacters();
    if (avatars.length) {
      await setCachedAsync(CACHE_KEY, avatars, CACHE_TTL);
      return NextResponse.json({ avatars });
    }
    return NextResponse.json({ avatars: [] });
  } catch (e) {
    return NextResponse.json({ avatars: [], error: e.message }, { status: 200 });
  }
}
