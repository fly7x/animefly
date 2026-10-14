"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import AnimeCard from "./AnimeCard";
import styles from "./BrowseClient.module.css";

const CATS = [
  { label: "Top Airing",       value: "top-airing" },
  { label: "Most Popular",     value: "most-popular" },
  { label: "Most Favorite",    value: "most-favorite" },
  { label: "Upcoming",         value: "upcoming" },
  { label: "Recently Updated", value: "recently-updated" },
  { label: "Finished Airing",  value: "completed" },
];

const GENRES = [
  "Action","Adventure","Comedy","Drama","Fantasy","Horror","Mahou Shoujo",
  "Mecha","Music","Mystery","Psychological","Romance","Sci-Fi","Slice of Life",
  "Sports","Supernatural","Thriller",
];

function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1].filter(p => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out = []; let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p); prev = p;
  }
  return out;
}

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } }
};

export default function BrowseClient() {
  const sp     = useSearchParams();
  const router = useRouter();
  const cat    = sp.get("category") || "top-airing";
  const page   = parseInt(sp.get("page") || "1");

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [catOpen,   setCatOpen]   = useState(true);
  const [genreOpen, setGenreOpen] = useState(true);

  useEffect(() => {
    setLoading(true); setError(null); setData(null);
    api.category(cat, page)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [cat, page]);

  function setCategory(c) { router.push(`/browse?category=${c}&page=1`); }
  function goPage(p)       { router.push(`/browse?category=${cat}&page=${p}`); window.scrollTo({ top: 0 }); }

  const animes     = data?.animes || [];
  const totalPages = data?.totalPages || 1;
  const isGenre    = cat.startsWith("genre/");
  const genreSlug  = isGenre ? cat.replace("genre/", "") : null;
  const activeLabel = isGenre
    ? GENRES.find(g => g.toLowerCase().replace(/ /g, "-") === genreSlug) || genreSlug?.replace(/-/g, " ")
    : CATS.find(c => c.value === cat)?.label || cat;

  return (
    <div className={`container ${styles.page}`}>

      <div className={styles.layout}>

        {/* ── Sidebar — always visible, no "Filter" click needed ── */}
        <aside className={styles.sidebar}>
          {/* Categories */}
          <div className={styles.sideBlock}>
            <button
              type="button"
              className={styles.sideLabel}
              onClick={() => setCatOpen(v => !v)}
              aria-expanded={catOpen}
            >
              <span className={styles.sideLabelAccent} />
              Categories
              <motion.span
                className={styles.chevron}
                animate={{ rotate: catOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {catOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <ul className={styles.catList}>
                    {CATS.map(c => (
                      <li key={c.value}>
                        <motion.button
                          className={`${styles.catBtn} ${c.value === cat ? styles.catActive : ""}`}
                          onClick={() => setCategory(c.value)}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className={styles.catIcon} />
                          {c.label}
                          {c.value === cat && <span className={styles.catActiveDot} />}
                        </motion.button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Genres */}
          <div className={styles.sideBlock}>
            <button
              type="button"
              className={styles.sideLabel}
              onClick={() => setGenreOpen(v => !v)}
              aria-expanded={genreOpen}
            >
              <span className={styles.sideLabelAccent} />
              Genres
              <motion.span
                className={styles.chevron}
                animate={{ rotate: genreOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {genreOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className={styles.genreGrid}>
                    {GENRES.map(g => {
                      const slug = `genre/${g.toLowerCase().replace(/ /g, "-")}`;
                      return (
                        <motion.button
                          key={g}
                          className={`${styles.genreBtn} ${cat === slug ? styles.genreActive : ""}`}
                          onClick={() => setCategory(slug)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          {g}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className={styles.main}>

          {/* Header */}
          <div className={styles.mainHeader}>
            <div className={styles.mainTitleWrap}>
              <span className={styles.mainTitleAccent} />
              <h1 className={styles.mainTitle}>{activeLabel}</h1>
            </div>
            {!loading && animes.length > 0 && (
              <span className={styles.resultCount}>
                {data?.totalPages && `Page ${page} of ${data.totalPages}`}
              </span>
            )}
          </div>

          {/* Error */}
          {error && !loading && (
            <div className={styles.errMsg}>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`skeleton ${styles.skeletonPoster}`} />
                  <div className={styles.skeletonInfo}>
                    <div className={`skeleton ${styles.skeletonTitle}`} />
                    <div className={`skeleton ${styles.skeletonMeta}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className={styles.grid}
              key={`${cat}-${page}`}
              variants={gridVariants}
              initial="hidden"
              animate="show"
            >
              {animes.map(anime => (
                <motion.div key={anime.id} variants={cardVariants}>
                  <AnimeCard anime={anime} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <motion.button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => goPage(page - 1)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
              >← Prev</motion.button>

              {buildPages(page, totalPages).map((p, i) =>
                p === "…"
                  ? <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
                  : (
                    <motion.button
                      key={p}
                      className={`${styles.pageNum} ${p === page ? styles.pageNumActive : ""}`}
                      onClick={() => goPage(p)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                    >{p}</motion.button>
                  )
              )}

              <motion.button
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => goPage(page + 1)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
              >Next →</motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
