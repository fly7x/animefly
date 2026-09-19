export const metadata = { title: "DMCA Policy — Fly Anime" };

export default function DmcaPage() {
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.h1}>DMCA Policy</h1>
        <p style={s.updated}>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <Section title="No Content Hosted">
          Fly Anime does not host, store, or upload any video files on its own servers. All video
          content available through this site is embedded from or hosted by unaffiliated
          third-party providers. Fly Anime acts solely as an index and does not control the
          content of those external sources.
        </Section>

        <Section title="Filing a Takedown Request">
          If you are a copyright holder or an agent authorized to act on behalf of one, and you
          believe that content accessible through Fly Anime infringes your copyright, you may
          submit a takedown notice through our Discord server with the following information:
        </Section>

        <ul style={s.list}>
          <li style={s.li}>A description of the copyrighted work you believe has been infringed</li>
          <li style={s.li}>The specific URL or page on Fly Anime where the content appears</li>
          <li style={s.li}>Your contact information (name and email)</li>
          <li style={s.li}>A statement that you have a good faith belief the use is unauthorized</li>
          <li style={s.li}>A statement, under penalty of perjury, that the information is accurate</li>
        </ul>

        <Section title="Our Response">
          Since Fly Anime does not host the actual video files, we cannot remove the underlying
          content directly. However, we will remove or disable links to the reported content on
          our site upon receiving a valid notice, and will direct you to the appropriate
          third-party host where applicable.
        </Section>

        <Section title="Contact">
          DMCA and copyright inquiries can be submitted through our Discord server.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <h2 style={s.h2}>{title}</h2>
      <p style={s.p}>{children}</p>
    </div>
  );
}

const s = {
  wrap: { minHeight: "100vh", backgroundColor: "var(--bg)", padding: "60px 20px", fontFamily: "Inter,sans-serif" },
  card: { maxWidth: "720px", margin: "0 auto" },
  h1: { color: "#fff", fontSize: "28px", fontWeight: 800, margin: "0 0 6px" },
  updated: { color: "#606070", fontSize: "13px", margin: "0 0 32px" },
  section: { marginBottom: "24px" },
  h2: { color: "var(--accent)", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" },
  p: { color: "#a0a0b0", fontSize: "14px", lineHeight: 1.7, margin: 0 },
  list: { margin: "0 0 24px", paddingLeft: "20px" },
  li: { color: "#a0a0b0", fontSize: "14px", lineHeight: 1.8 },
};
