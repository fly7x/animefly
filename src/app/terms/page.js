export const metadata = { title: "Terms of Use — Fly Anime" };

export default function TermsPage() {
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.h1}>Terms of Use</h1>
        <p style={s.updated}>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <Section title="1. Acceptance of Terms">
          By accessing and using Fly Anime, you agree to be bound by these Terms of Use. If you
          do not agree, please do not use this site.
        </Section>

        <Section title="2. Use of the Site">
          Fly Anime is provided free of charge for personal, non-commercial use. You agree not to
          attempt to disrupt the site, scrape content at scale, or use it for any unlawful purpose.
        </Section>

        <Section title="3. Third-Party Content">
          Fly Anime does not host, upload, or store any video files on its own servers. All
          streaming content is embedded from or linked to third-party sources. We do not claim
          ownership of any anime, images, or related media displayed on this site.
        </Section>

        <Section title="4. Accounts">
          You are responsible for maintaining the confidentiality of your account credentials.
          You must provide accurate information when registering.
        </Section>

        <Section title="5. User Comments">
          Comments posted on Fly Anime must follow basic community guidelines: no harassment, no
          spam, no illegal content. We reserve the right to remove any comment or account that
          violates these guidelines.
        </Section>

        <Section title="6. Limitation of Liability">
          Fly Anime is provided "as is" without warranties of any kind. We are not liable for any
          damages resulting from your use of the site or reliance on third-party streaming sources.
        </Section>

        <Section title="7. Changes to Terms">
          These terms may be updated periodically. Continued use of the site after changes
          constitutes acceptance of the new terms.
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
