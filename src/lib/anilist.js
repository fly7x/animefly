/**
 * AniList GraphQL API client
 * Docs: https://anilist.gitbook.io/anilist-apiv2-docs/
 * Endpoint: https://graphql.anilist.co
 */

import axios from "axios";
import { toSlug as _toSlug, idFromSlug as _idFromSlug } from "./utils.js";
import { extractTmdbIdFromLinks as _extractTmdb } from "./tmdb.js";

const ANILIST = "https://graphql.anilist.co";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Rate limiter ──────────────────────────────────────────────────────────────
const RATE_LIMIT_MS = 1000;
let   _lastRequest  = 0;
let   _queue        = Promise.resolve();

function rateLimit() {
  _queue = _queue.then(() => {
    const now  = Date.now();
    const wait = Math.max(0, _lastRequest + RATE_LIMIT_MS - now);
    _lastRequest = now + wait;
    return wait > 0 ? sleep(wait) : undefined;
  });
  return _queue;
}

let _blockedUntil = 0;

async function query(gql, variables = {}) {
  if (_blockedUntil > Date.now()) {
    const remaining = Math.ceil((_blockedUntil - Date.now()) / 1000);
    throw new Error(`AniList blocked — ${remaining}s remaining`);
  }

  await rateLimit();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data } = await axios.post(
        ANILIST,
        { query: gql, variables },
        {
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
            Accept:         "application/json",
          },
        }
      );
      _blockedUntil = 0;
      return data?.data;

    } catch (e) {
      const status = e.response?.status;

      if (status === 429) {
        const retryAfter = parseInt(e.response?.headers?.["retry-after"] || "60", 10);
        const blockMs    = Math.min(retryAfter * 1000, 120_000);
        _blockedUntil    = Date.now() + blockMs;
        console.warn(`[anilist] 429 — blocked for ${retryAfter}s`);
        throw new Error(`AniList rate limited — retry after ${retryAfter}s`);
      }

      if (status === 403) {
        _blockedUntil = Date.now() + 30_000;
        console.warn(`[anilist] 403 — blocked for 30s (attempt ${attempt + 1}/3)`);
        if (attempt < 2) { await sleep(5000); continue; }
        throw new Error("AniList returned 403 — IP temporarily blocked");
      }

      if (status >= 500) {
        console.warn(`[anilist] ${status} server error (attempt ${attempt + 1}/3)`);
        if (attempt < 2) { await sleep(Math.pow(2, attempt) * 1000); continue; }
      }

      const gqlErrors = e.response?.data?.errors;
      if (gqlErrors) throw new Error(gqlErrors.map(e => e.message).join(", "));
      throw e;
    }
  }
}

// Fragment reused across queries
// Formats/origins we don't want showing up anywhere on this anime-only site
// (donghua/Chinese & Taiwanese animation, music videos, etc.)
const EXCLUDED_FORMATS = new Set(["MUSIC"]);
const EXCLUDED_ORIGINS = new Set(["CN", "TW"]);

function excludeNonAnime(mediaList) {
  return (mediaList || []).filter(
    m => m && !EXCLUDED_ORIGINS.has(m.countryOfOrigin) && !EXCLUDED_FORMATS.has(m.format)
  );
}

const MEDIA_FRAGMENT = `
  id
  idMal
  title { romaji english native }
  description(asHtml: false)
  coverImage { extraLarge large medium }
  bannerImage
  format
  status
  countryOfOrigin
  isAdult
  episodes
  duration
  season
  seasonYear
  averageScore
  meanScore
  popularity
  genres
  source
  studios(isMain: true) { nodes { name } }
  startDate { year month day }
  endDate   { year month day }
  trailer { id site }
  synonyms
  nextAiringEpisode { airingAt episode }
  externalLinks { url site type language }
  rankings { rank type allTime season year }
  tags { name rank isMediaSpoiler category }
`;

/** Format an AniList date object { year, month, day } → "YYYY-MM-DD" */
function formatDate(d) {
  if (!d || !d.year) return "";
  const mm = d.month ? "-" + String(d.month).padStart(2, "0") : "";
  const dd = d.day   ? "-" + String(d.day).padStart(2, "0")   : "";
  return d.year + mm + dd;
}

// Normalise a raw AniList media object to our app's shape
export function normalizeMedia(m) {
  if (!m) return null;
  const title = m.title?.english || m.title?.romaji || m.title?.native || "";
  const slug  = toSlug(title, m.id);
  return {
    id:          slug,
    anilistId:   m.id,
    malId:       m.idMal,
    name:        title,
    jname:       m.title?.native || m.title?.romaji || "",
    poster:      m.coverImage?.extraLarge || m.coverImage?.large || "",
    banner:      m.bannerImage || m.coverImage?.extraLarge || "",
    description: m.description || "",
    type:        m.format || "",
    status:      m.status || "",
    rating:      m.averageScore ? m.averageScore + "%" : "",
    duration:    m.duration ? m.duration + "m" : "",
    genres:      m.genres || [],
    studios:     m.studios?.nodes?.map(s => s.name).join(", ") || "",
    season:      m.season && m.seasonYear ? m.season + " " + m.seasonYear : "",
    episodes: {
      sub: m.episodes || 0,
      dub: 0,
    },
    startDate:   formatDate(m.startDate),
    endDate:     formatDate(m.endDate),
    nextAiring:  m.nextAiringEpisode || null,
    trailer:     m.trailer || null,
    source:      m.source ? m.source.replace(/_/g, " ") : "",
    meanScore:   m.meanScore || null,
    rankings:    m.rankings || [],
    tags:        (m.tags || []).filter(t => !t.isMediaSpoiler).sort((a,b) => (b.rank||0)-(a.rank||0)).slice(0, 12),
    externalLinks: (m.externalLinks || []).filter(l =>
      ["Crunchyroll", "Funimation", "Netflix", "Amazon", "HIDIVE",
       "MyAnimeList", "AniList", "Official Site"].includes(l.site)
    ),
  };
}

/** Convert title + id to a URL-safe slug */
export function toSlug(title, id) { return _toSlug(title, id); }
export function idFromSlug(slug) { return _idFromSlug(slug); }

// ── API methods ───────────────────────────────────────────────────────────────

export async function getHomePage() {
  const data = await query(`
    query {
      trending: Page(page: 1, perPage: 15) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) { ${MEDIA_FRAGMENT} }
      }
      popular: Page(page: 1, perPage: 15) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status: RELEASING) { ${MEDIA_FRAGMENT} }
      }
      topRated: Page(page: 1, perPage: 15) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false, format_not_in: [MUSIC]) { ${MEDIA_FRAGMENT} }
      }
      upcoming: Page(page: 1, perPage: 15) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status: NOT_YET_RELEASED) { ${MEDIA_FRAGMENT} }
      }
    }
  `);

  // "Recently Updated" = real, popular anime that just aired a new episode.
  // (Sorting by AniList's UPDATED_AT surfaced obscure kids/mascot shows whose
  // metadata is edited constantly, so we use actual airing times instead.)
  const seenIds = new Set();
  const recentRaw = [];
  let recentSchedules = [];
  try {
    const nowS = Math.floor(Date.now() / 1000);
    const rd = await query(`
      query {
        Page(page: 1, perPage: 50) {
          airingSchedules(airingAt_greater: ${nowS - 3 * 86400}, airingAt_lesser: ${nowS}, sort: TIME_DESC) {
            episode
            airingAt
            media { ${MEDIA_FRAGMENT} }
          }
        }
      }
    `);
    recentSchedules = rd?.Page?.airingSchedules || [];
  } catch {}
  // Fallback if the schedule lookup fails: popular currently-airing shows
  // (never the old metadata-updated sort, which showed obscure kids shows).
  if (!recentSchedules.length) recentSchedules = (data?.popular?.media || []).map(media => ({ media }));
  for (const entry of recentSchedules) {
    const m = entry?.media;
    if (!m || seenIds.has(m.id)) continue;
    if (m.isAdult) continue;
    if (!["TV", "ONA", "TV_SHORT"].includes(m.format)) continue;
    if ((m.popularity || 0) < 15000) continue;
    seenIds.add(m.id);
    recentRaw.push(m);
  }

  const trending        = excludeNonAnime(data?.trending?.media).map(normalizeMedia).filter(Boolean);
  const popular         = excludeNonAnime(data?.popular?.media).map(normalizeMedia).filter(Boolean);
  const topRated        = excludeNonAnime(data?.topRated?.media).map(normalizeMedia).filter(Boolean);
  const upcoming        = excludeNonAnime(data?.upcoming?.media).map(normalizeMedia).filter(Boolean);
  const recentlyUpdated = excludeNonAnime(recentRaw).slice(0, 18).map(normalizeMedia).filter(Boolean);

  return {
    spotlightAnimes:       trending.slice(0, 8).map((a, i) => ({ ...a, rank: i + 1, otherInfo: [a.type, a.season, a.status].filter(Boolean) })),
    trendingAnimes:        trending,
    latestEpisodeAnimes:   recentlyUpdated,
    topAiringAnimes:       popular,
    mostFavoriteAnimes:    topRated,
    latestCompletedAnimes: topRated.slice(0, 10),
    top10Animes: { today: trending.slice(0, 10), week: popular.slice(0, 10) },
  };
}

export async function searchAniList(q, page = 1) {
  const data = await query(`
    query($search: String, $page: Int) {
      Page(page: $page, perPage: 20) {
        pageInfo { total currentPage lastPage hasNextPage perPage }
        media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) { ${MEDIA_FRAGMENT} }
      }
    }
  `, { search: q, page: Number(page) });

  const page_data = data?.Page;
  return {
    animes:      excludeNonAnime(page_data?.media).map(normalizeMedia).filter(Boolean),
    totalPages:  page_data?.pageInfo?.lastPage  ?? 1,
    hasNextPage: page_data?.pageInfo?.hasNextPage ?? false,
    currentPage: Number(page),
  };
}

export async function getAnimeBySlug(slug) {
  const anilistId = idFromSlug(slug);
  if (!anilistId) return null;

  const data = await query(`
    query($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FRAGMENT}
        relations {
          edges {
            relationType(version: 2)
            node { id title { romaji english } coverImage { large } format episodes }
          }
        }
        recommendations(sort: RATING_DESC, perPage: 8) {
          nodes { mediaRecommendation { ${MEDIA_FRAGMENT} } }
        }
        characters(sort: ROLE, perPage: 20) {
          edges { role node { id name { full } image { medium } } }
        }
      }
    }
  `, { id: anilistId });

  const m = data?.Media;
  if (!m) return null;
  const base = normalizeMedia(m);

  const relatedAnimes = (m.relations?.edges || [])
    .filter(e => ["PREQUEL","SEQUEL","SIDE_STORY","PARENT","ALTERNATIVE"].includes(e.relationType))
    .map(e => normalizeMedia(e.node)).filter(Boolean);

  const recommendedAnimes = (m.recommendations?.nodes || [])
    .map(n => normalizeMedia(n.mediaRecommendation)).filter(Boolean);

  const characters = (m.characters?.edges || []).map(e => ({
    id:    e.node?.id,
    name:  e.node?.name?.full || "",
    image: e.node?.image?.medium || "",
    role:  e.role || "SUPPORTING",
  })).filter(c => c.name);

  // Top ranking entry (e.g. #12 All Time, #3 This Season)
  const topRank = (base.rankings || []).find(r => r.allTime) || (base.rankings || [])[0] || null;

  return {
    anime: {
      info: base,
      moreInfo: {
        type:         m.format    || "",
        status:       m.status    || "",
        aired:        base.startDate || "",
        ended:        base.endDate   || "",
        studios:      base.studios,
        genres:       m.genres || [],
        duration:     base.duration,
        season:       base.season,
        source:       base.source,
        score:        base.meanScore ? base.meanScore + "/100" : "",
        rank:         topRank ? "#" + topRank.rank + (topRank.allTime ? " All Time" : "") : "",
        tags:         base.tags,
        synonyms:     (m.synonyms || []).slice(0, 4),
        externalLinks: base.externalLinks,
        trailer:      base.trailer,
      },
    },
    relatedAnimes,
    recommendedAnimes,
    seasons: relatedAnimes.filter(a => a.type === "TV" || a.type === "OVA"),
    characters,
  };
}

export async function getCategoryPage(category, page = 1) {
  const queryMap = {
    "top-airing":       { sort: "POPULARITY_DESC", status: "RELEASING" },
    "most-popular":     { sort: "POPULARITY_DESC" },
    "most-favorite":    { sort: "FAVOURITES_DESC" },
    "upcoming":         { sort: "POPULARITY_DESC", status: "NOT_YET_RELEASED" },
    "top-upcoming":     { sort: "POPULARITY_DESC", status: "NOT_YET_RELEASED" },
    "recently-updated": { sort: "UPDATED_AT_DESC", status: "RELEASING" },
    "completed":        { sort: "SCORE_DESC",       status: "FINISHED" },
    "recently-added":   { sort: "ID_DESC" },
  };

  let genre = null;
  if (category.startsWith("genre/")) {
    const slug = category.replace("genre/", "");
    const KNOWN = ["Action","Adventure","Comedy","Drama","Fantasy","Horror","Mahou Shoujo","Mecha","Music","Mystery","Psychological","Romance","Sci-Fi","Slice of Life","Sports","Supernatural","Thriller"];
    genre = KNOWN.find(g => g.toLowerCase().replace(/ /g, "-") === slug)
      || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  const cfg = queryMap[category] || { sort: "POPULARITY_DESC" };
  const sortEnum     = cfg.sort;
  const statusFilter = cfg.status ? "status: " + cfg.status : "";
  const genreFilter  = genre ? "genre: \"" + genre + "\"" : "";

  // AniList's GraphQL API hard-caps perPage at 50 (requesting more throws
  // a validation error), so 50 is the most we can show per page in a
  // single request. This is already a big bump from the old 42.
  const data = await query(`
    query($page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(sort: ${sortEnum}, type: ANIME, isAdult: false ${statusFilter ? ", " + statusFilter : ""} ${genreFilter ? ", " + genreFilter : ""}, format_not_in: [MUSIC]) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `, { page: Number(page) });

  const pg = data?.Page;
  return {
    animes:      excludeNonAnime(pg?.media).map(normalizeMedia).filter(Boolean),
    totalPages:  pg?.pageInfo?.lastPage  ?? 1,
    hasNextPage: pg?.pageInfo?.hasNextPage ?? false,
    category,
    currentPage: Number(page),
  };
}

// ── Avatar characters ─────────────────────────────────────────────────────────
// Pulls the most-favorited anime characters straight from AniList's own CDN
// (s4.anilist.co — the same host that already serves every poster on this
// site, so it's proven to load). This replaces a third-party avatar CDN that
// started blocking hotlinked requests.
export async function getAvatarCharacters() {
  const data = await query(`
    query {
      Page(page: 1, perPage: 48) {
        characters(sort: FAVOURITES_DESC) {
          id
          name { full }
          image { large }
        }
      }
    }
  `);
  const chars = data?.Page?.characters || [];
  return chars
    .filter(c => c?.image?.large)
    .map(c => ({ url: c.image.large, label: c.name?.full || "Avatar" }));
}

export async function getAniListEpisodeMeta(anilistId) {
  const data = await query(`
    query($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        episodes
        title { romaji english native }
        synonyms
        seasonYear
        nextAiringEpisode { episode }
        externalLinks { url site }
        airingSchedule(notYetAired: false, perPage: 50) {
          nodes { episode airingAt }
        }
      }
    }
  `, { id: anilistId });

  const m = data?.Media;
  if (!m) return { episodes: [], totalEpisodes: 0, title: "", malId: null };

  const title    = m.title?.english || m.title?.romaji || "";
  const totalEps = m.episodes || m.nextAiringEpisode?.episode || 0;
  const airNodes = m.airingSchedule?.nodes || [];

  const episodes = Array.from({ length: totalEps }, (_, i) => {
    const node = airNodes.find(n => n.episode === i + 1);
    return {
      number:  i + 1,
      airDate: node ? new Date(node.airingAt * 1000).toISOString().split("T")[0] : "",
    };
  });

  const tmdbInfo = _extractTmdb(m.externalLinks || []);
  const tmdbId   = tmdbInfo?.tmdbId || null;

  const allTitles = [
    m.title?.english, m.title?.romaji, m.title?.native,
    ...(m.synonyms || [])
  ].filter(Boolean);

  return { episodes, totalEpisodes: totalEps, title, allTitles, malId: m.idMal, anilistId: m.id, seasonYear: m.seasonYear || null, tmdbId };
}
