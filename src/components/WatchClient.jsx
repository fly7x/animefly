/**
 * WatchClient — MegaPlay-only watch page
 *
 * Streams exclusively via MegaPlay embeds:
 *   https://megaplay.buzz/stream/ani/{anilistId}/{episode}/{sub|dub}
 *
 * Crysoline and every other source have been removed per site owner's request.
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { idFromSlug } from "@/lib/utils";
import { saveProgress } from "@/lib/watchProgress";
import { useQuery, prefetch } from "@/hooks/useQuery";
import CommentsSection from "./CommentsSection";
import AniListPanel from "./AniListPanel";
import styles from "./WatchClient.module.css";

const MEGAPLAY_BASE = "https://megaplay.buzz/stream/ani";
function buildMegaplayUrl(anilistId, episode, lang) {
  if (!anilistId) return null;
  return `${MEGAPLAY_BASE}/${anilistId}/${episode}/${lang}`;
}

// ── Skeleton components ───────────────────────────────────────────────────────
function EpisodeSkeleton() {
  return (
    <div className={styles.epSkelWrap}>
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className={`skeleton ${styles.epSkel}`} />
      ))}
    </div>
  );
}

function InfoPanelSkeleton() {
  return (
    <div className={styles.infoPanel}>
      <div className={`skeleton ${styles.infoPosterWrap}`} style={{ background: "#222" }} />
      <div className={styles.infoBody}>
        <div className="skeleton" style={{ height: 22, width: "60%", borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: "40%", borderRadius: 4, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 60, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WatchClient({ animeId, epSlug }) {
  const router    = useRouter();
  const anilistId = idFromSlug(animeId);

  // ── Data fetching with cache ───────────────────────────────────────────────
  const { data: infoData } = useQuery(
    `info:${animeId}`,
    () => api.info(animeId),
    { ttl: 300 }
  );
  const { data: epsData, loading: epsLoading } = useQuery(
    `episodes:${animeId}`,
    () => api.episodes(animeId),
    { ttl: 180 }
  );

  const info     = infoData;
  const eps      = epsData?.episodes || [];
  const anime    = info?.anime?.info;
  const moreInfo = info?.anime?.moreInfo;
  const related  = info?.relatedAnimes     || [];
  const recs     = info?.recommendedAnimes || [];
  const seasons  = info?.seasons           || [];

  // ── Episode navigation ────────────────────────────────────────────────────
  const [showAllEps, setShowAllEps] = useState(false);
  const currentIdx = eps.findIndex(e => e.epSlug === epSlug);
  const currentEp  = eps[currentIdx] || null;
  const prevEp     = currentIdx > 0            ? eps[currentIdx - 1] : null;
  const nextEp     = currentIdx < eps.length-1 ? eps[currentIdx + 1] : null;
  const epNumber   = parseInt(epSlug.replace("ep-", "")) || 1;
  const dispEps    = showAllEps ? eps : eps.slice(0, 60);

  // ── Sub / Dub + reload state ──────────────────────────────────────────────
  const [lang,        setLang]        = useState("sub");
  const [embedReload,  setEmbedReload] = useState(0);
  const [embedLoading, setEmbedLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("player_lang_pref");
      if (saved === "sub" || saved === "dub") setLang(saved);
    } catch {}
  }, []);

  function changeLang(l) {
    setLang(l);
    setEmbedLoading(true);
    setEmbedReload(r => r + 1);
    try { localStorage.setItem("player_lang_pref", l); } catch {}
  }

  const embedUrl = anilistId ? buildMegaplayUrl(anilistId, epNumber, lang) : null;

  // ── Save progress — only after 10 seconds ─────────────────────────────────
  useEffect(() => {
    if (!anime || !epNumber || !animeId) return;
    const timer = setTimeout(() => {
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anime_id: animeId,
          anime_name: anime.name,
          poster: anime.poster || null,
          anilist_id: String(anilistId || ""),
          episode_number: epNumber,
          finished: false,
          seconds_watched: 10,
        }),
      }).catch(() => {});
      try {
        saveProgress({
          animeId, epSlug, animeName: anime.name,
          poster: anime.poster || null, epNumber,
        });
      } catch {}
    }, 10000);
    return () => clearTimeout(timer);
  }, [animeId, epSlug, epNumber, anime?.name, anime?.poster, anilistId]);

  // ── Episode hover prefetch ─────────────────────────────────────────────────
  const prefetchEp = (ep) => {
    if (!ep) return;
    prefetch(`episodes:${animeId}`, () => api.episodes(animeId), 180);
  };

  // ── Navigate to episode ────────────────────────────────────────────────────
  const goToEp = useCallback((ep) => {
    if (!ep) return;
    router.push(`/watch/${animeId}/${ep.epSlug}`);
  }, [animeId, router]);

  // Reset embed loading state whenever the episode changes
  useEffect(() => { setEmbedLoading(true); }, [epSlug, lang]);

  // ── Episode progress helper ────────────────────────────────────────────────
  function getEpProgress(animeId, epNum) {
    if (typeof window === "undefined") return 0;
    try {
      const saved = parseFloat(localStorage.getItem(`cw_${animeId}_ep${epNum}`) || "0") || 0;
      if (saved < 10) return 0;
      const duration = 1440;
      return Math.min(100, Math.round((saved / duration) * 100));
    } catch { return 0; }
  }

  const sidebarSections = [
    ...(seasons.length > 0 ? [{ label: "Seasons",           items: seasons }]           : []),
    ...(related.length > 0  ? [{ label: "Related",           items: related.slice(0, 6) }]: []),
    ...(recs.length > 0     ? [{ label: "You May Also Like", items: recs.slice(0, 6) }]   : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.watchPage}>
      <div className={styles.playerSection}>

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>›</span>
          {anime
            ? <Link href={`/anime/${animeId}`}>{anime.name}</Link>
            : <span className="skeleton" style={{ width: 120, height: 14, display: "inline-block", borderRadius: 3 }} />
          }
          <span className={styles.sep}>›</span>
          <span>Episode {epNumber}</span>
        </nav>

        {/* Player */}
        <div className={styles.playerWrap}>
          {epsLoading && !currentEp && (
            <div className={styles.playerState}>
              <div className="spinner" /><p>Loading…</p>
            </div>
          )}
          {!epsLoading && !currentEp && (
            <div className={styles.playerState}><span>!</span><p>Episode not found.</p></div>
          )}

          {currentEp && (
            <>
              {!embedUrl && (
                <div className={styles.playerState}><p>Unable to load this episode.</p></div>
              )}
              {embedUrl && (
                <>
                  {embedLoading && (
                    <div className={styles.playerState}>
                      <div className="spinner" />
                      <p>Loading stream…</p>
                    </div>
                  )}
                  <iframe
                    key={`${lang}-${epSlug}-${embedReload}`}
                    src={embedUrl}
                    className={styles.iframe}
                    style={embedLoading ? { opacity: 0, pointerEvents: "none" } : undefined}
                    frameBorder="0"
                    scrolling="no"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    title={`${anime?.name || "Anime"} Episode ${epNumber}`}
                    onLoad={() => setEmbedLoading(false)}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* ── Control panel ─────────────────────────────────────────────── */}
        <div className={styles.controlPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.modeTabs}>
              <button className={`${styles.modeTab} ${styles.modeTabActive}`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                MegaPlay
              </button>
            </div>
            <button className={styles.reloadBtn} onClick={() => { setEmbedLoading(true); setEmbedReload(r => r + 1); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-4.5"/>
              </svg>
              Reload
            </button>
          </div>

          <div className={styles.cryBody}>
            <div className={styles.serverInfo}>
              <p className={styles.serverInfoText}>
                You are watching <strong>Episode {epNumber}</strong>.
                If the stream doesn&apos;t load, hit Reload.
              </p>
            </div>

            <div className={styles.serverRow}>
              <span className={styles.serverRowLabel}>Language</span>
              <div className={styles.serverBtns}>
                <button
                  className={`${styles.serverBtn} ${lang === "sub" ? styles.serverBtnActive : ""}`}
                  onClick={() => changeLang("sub")}
                >Sub</button>
                <button
                  className={`${styles.serverBtn} ${lang === "dub" ? styles.serverBtnActive : ""}`}
                  onClick={() => changeLang("dub")}
                >Dub</button>
              </div>
            </div>
          </div>
        </div>

        {/* Episode nav with prefetch on hover */}
        <div className={styles.epNav}>
          <button className={styles.navBtn} disabled={!prevEp}
            onMouseEnter={() => prefetchEp(prevEp)}
            onClick={() => goToEp(prevEp)}>
            ← Prev
          </button>
          <div className={styles.navMid}>
            <span className={styles.epLabel}>Episode {epNumber}</span>
            {currentEp?.airDate && <span className={styles.airDate}>{currentEp.airDate}</span>}
          </div>
          <button className={styles.navBtn} disabled={!nextEp}
            onMouseEnter={() => prefetchEp(nextEp)}
            onClick={() => goToEp(nextEp)}>
            Next →
          </button>
        </div>

        {/* Next episode release date */}
        {!nextEp && (info?.anime?.info?.nextAiring || info?.anime?.moreInfo?.nextAiring) && (() => {
          const nextAiring = info?.anime?.info?.nextAiring || info?.anime?.moreInfo?.nextAiring;
          const { airingAt, episode } = nextAiring;
          const releaseDate = new Date(airingAt * 1000);
          const now = new Date();
          const diffMs = releaseDate - now;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const formatted = releaseDate.toLocaleDateString(undefined, {
            weekday: "short", month: "short", day: "numeric",
          });
          const timeStr = diffMs > 0
            ? diffDays === 0 ? "today" : diffDays === 1 ? "tomorrow" : `in ${diffDays} days`
            : null;
          return (
            <div className={styles.nextEpBanner}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <span>
                Episode {episode} releases on <strong>{formatted}</strong>
                {timeStr && <> — <em>{timeStr}</em></>}
              </span>
            </div>
          );
        })()}

        {/* Anime info panel */}
        {!anime ? <InfoPanelSkeleton /> : (
          <div className={styles.infoPanel}>
            <div className={styles.infoPosterWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={anime.poster} alt={anime.name} className={styles.infoPoster} />
            </div>
            <div className={styles.infoBody}>
              <Link href={`/anime/${animeId}`} className={styles.infoTitle}>{anime.name}</Link>
              {anime.jname && anime.jname !== anime.name && (
                <p className={styles.infoJname}>{anime.jname}</p>
              )}
              <div className={styles.infoMeta}>
                {anime.rating  && <span className={styles.ratingBadge}>★ {anime.rating}</span>}
                {anime.type    && <span className={styles.metaTag}>{anime.type}</span>}
                {anime.status  && <span className={styles.metaTag}>{(anime.status || "").replace(/_/g, " ")}</span>}
              </div>
              {moreInfo?.genres?.length > 0 && (
                <div className={styles.infoGenres}>
                  {moreInfo.genres.slice(0, 4).map(g => (
                    <Link key={g} href={`/browse?category=genre/${g.toLowerCase().replace(/ /g, "-")}`} className="tag">{g}</Link>
                  ))}
                </div>
              )}
              {anime.description && (
                <p className={styles.infoDesc}>
                  {anime.description.replace(/<[^>]*>/g, "").slice(0, 200)}
                  {anime.description.length > 200 ? "…" : ""}
                </p>
              )}
              <div className={styles.infoActions}>
                <Link href={`/anime/${animeId}`} className={styles.viewMoreLink}>Full details →</Link>
                {nextEp && (
                  <button className={styles.nextEpBtn} onClick={() => goToEp(nextEp)}>
                    Next Ep →
                  </button>
                )}
              </div>

              {anilistId && (
                <div style={{ marginTop: 14 }}>
                  <AniListPanel
                    anilistId={anilistId}
                    epNumber={epNumber}
                    totalEpisodes={anime?.episodes?.sub || null}
                    compact
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <CommentsSection
          animeId={anilistId}
          malId={moreInfo?.malId}
          epNumber={epNumber}
          title={anime?.name}
        />
      </div>

      {/* Right column */}
      <div className={styles.rightCol}>
        <div className={styles.epSidebar}>
          <div className={styles.epSideHead}>
            <p className={styles.epSideTitle}>{anime?.name || "Episodes"}</p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span className={styles.epSideCount}>
                {(() => {
                  const loaded = eps.length;
                  const total  = anime?.episodes?.total
                    || info?.anime?.moreInfo?.nextAiring?.episode
                    || null;
                  if (total && total !== loaded) return loaded + " / " + total + " eps";
                  return loaded + " eps";
                })()}
              </span>
              {(anime?.episodes?.sub > 0 || anime?.episodes?.dub > 0) && (
                <span style={{ fontSize: 11, display: "flex", gap: 6 }}>
                  {anime.episodes.sub > 0 && <span className="badge badge-sub">SUB {anime.episodes.sub}</span>}
                  {anime.episodes.dub > 0 && <span className="badge badge-dub">DUB {anime.episodes.dub}</span>}
                </span>
              )}
            </div>
          </div>

          {/* Season selector tabs */}
          {seasons.length > 1 && (
            <div className={styles.seasonTabs}>
              {seasons.map(s => (
                <a
                  key={s.id}
                  href={`/anime/${s.id}`}
                  className={`${styles.seasonTab} ${s.id === animeId ? styles.seasonTabActive : ""}`}
                  title={s.name || s.title}
                >
                  {s.name || s.title}
                </a>
              ))}
            </div>
          )}

          <div className={styles.epList}>
            {epsLoading && eps.length === 0
              ? <EpisodeSkeleton />
              : dispEps.map(ep => (
                  <Link key={ep.epSlug} href={`/watch/${animeId}/${ep.epSlug}`}
                    className={`${styles.epItem} ${ep.epSlug === epSlug ? styles.epActive : ""} ${ep.isFiller ? styles.epFiller : ""}`}
                    onMouseEnter={() => prefetchEp(ep)}
                  >
                    <div className={styles.epContent}>
                      <span className={styles.epNum}>Ep {ep.number}</span>
                      {ep.isFiller && <span className={styles.fillerBadge}>FILLER</span>}
                    </div>
                    {getEpProgress(animeId, ep.number) > 0 && (
                      <div className={styles.epProgress} style={{ width: `${getEpProgress(animeId, ep.number)}%` }} />
                    )}
                  </Link>
                ))
            }
            {eps.length > 60 && !showAllEps && (
              <button className={styles.showAllBtn} onClick={() => setShowAllEps(true)}>
                Show all {eps.length} episodes
              </button>
            )}
          </div>
        </div>

        {sidebarSections.map(sec => (
          <div key={sec.label} className={styles.relatedBlock}>
            <h3 className={styles.relatedTitle}>{sec.label}</h3>
            <div className={styles.relatedList}>
              {sec.items.map(item => (
                <Link key={item.id} href={`/anime/${item.id}`} className={styles.relatedCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.poster} alt={item.name} className={styles.relatedPoster} loading="lazy" />
                  <div className={styles.relatedInfo}>
                    <p className={styles.relatedName}>{item.name}</p>
                    <div className={styles.relatedMeta}>
                      {item.type && <span>{item.type}</span>}
                      {item.episodes?.sub > 0 && <span className="badge badge-sub">{item.episodes.sub} eps</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
