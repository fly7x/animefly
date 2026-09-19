export const metadata = { title: "Privacy Policy — Fly Anime" };

export default function PrivacyPage() {
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.updated}>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <Section title="1. Information We Collect">
          When you create an account on Fly Anime, we collect your username, email address, and a
          securely hashed version of your password. We never store your password in plain text.
        </Section>

        <Section title="2. How We Use Your Information">
          Your account information is used to let you log in, keep track of your watchlist and
          watch history, and enable features like comments. We do not sell your personal
          information to third parties.
        </Section>

        <Section title="3. Cookies">
          We use a session cookie to keep you logged in. This cookie is required for the site to
          function and does not track you across other websites.
        </Section>

        <Section title="4. Third-Party Content">
          Fly Anime does not host any video files. Streaming content is sourced from third-party
          providers. We are not responsible for the privacy practices of those external services.
        </Section>

        <Section title="5. Data Storage">
          Account data is stored securely using industry-standard practices. You may request
          deletion of your account and associated data at any time through your profile settings.
        </Section>

        <Section title="6. Contact">
          For any privacy-related questions, reach out to us through our Discord server.
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
};
