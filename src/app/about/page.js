export const metadata = { title: "About — Fly Anime" };

export default function AboutPage() {
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <svg width="140" height="38" viewBox="0 0 100 28" fill="none">
            <text x="0" y="22" fontFamily="Inter,Arial Black,sans-serif" fontWeight="900" fontSize="22" fill="#f97316">Fly</text>
            <text x="42" y="22" fontFamily="Inter,Arial Black,sans-serif" fontWeight="900" fontSize="22" fill="#ffffff">Anime</text>
          </svg>
        </div>

        <h1 style={s.h1}>About Fly Anime</h1>
        <p style={s.p}>
          Fly Anime is a free anime streaming site built for fans who just want to watch anime
          without the hassle of sign-ups, subscriptions, or paywalls. Browse trending series,
          catch up on the latest episodes, and keep track of what you're watching — all in one
          place.
        </p>

        <p style={s.p}>
          The site is completely free to use and does not host any video files directly. All
          streaming content is sourced from publicly available third-party providers.
        </p>

        <h2 style={s.h2}>Join the Community</h2>
        <p style={s.p}>
          Get the latest updates, chat with other fans, and share feedback on our Discord server.
        </p>
        <a href="https://dsc.gg/flyanime" target="_blank" rel="noopener noreferrer" style={s.discordBtn}>
          Join our Discord →
        </a>
      </div>
    </div>
  );
}

const s = {
  wrap: { minHeight: "100vh", backgroundColor: "var(--bg)", padding: "60px 20px", fontFamily: "Inter,sans-serif" },
  card: { maxWidth: "640px", margin: "0 auto" },
  logoWrap: { marginBottom: "24px" },
  h1: { color: "#fff", fontSize: "28px", fontWeight: 800, margin: "0 0 20px" },
  h2: { color: "var(--accent)", fontSize: "18px", fontWeight: 700, margin: "28px 0 10px" },
  p: { color: "#a0a0b0", fontSize: "14px", lineHeight: 1.7, margin: "0 0 16px" },
  discordBtn: { display: "inline-block", backgroundColor: "#5865F2", color: "#fff", padding: "10px 22px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, textDecoration: "none" },
};
