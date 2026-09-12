"use client";
import Link from "next/link";

function FlyAnimeLogo() {
  return (
    <svg width="100" height="28" viewBox="0 0 100 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="22" fontFamily="Inter,Arial Black,sans-serif" fontWeight="900" fontSize="22" fill="#f97316">Fly</text>
      <text x="42" y="22" fontFamily="Inter,Arial Black,sans-serif" fontWeight="900" fontSize="22" fill="#ffffff">Anime</text>
    </svg>
  );
}

const LINKS = {
  Explore: [
    { label: "Home",     href: "/" },
    { label: "Browse",   href: "/browse" },
    { label: "Schedule", href: "/schedule" },
    { label: "Search",   href: "/search" },
  ],
  Account: [
    { label: "Login",    href: "/login" },
    { label: "Register", href: "/register" },
    { label: "Profile",  href: "/profile" },
    { label: "Settings", href: "/profile" },
  ],
  Legal: [
    { label: "DMCA",          href: "/dmca" },
    { label: "Privacy Policy",href: "/privacy" },
    { label: "Terms of Use",  href: "/terms" },
    { label: "About",         href: "/about" },
  ],
  Community: [
    { label: "Discord",     href: "https://dsc.gg/flyanime",  external: true },
    { label: "animedex.fun",href: "https://animedex.fun",     external: true },
  ],
};

export default function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.inner}>

        {/* Brand */}
        <div style={s.brand}>
          <FlyAnimeLogo />
          <p style={s.tagline}>
            Stream anime free in HD. Sub &amp; Dub available. No account required.
          </p>
          <p style={s.disclaimer}>
            Fly Anime does not host any video files. All content is sourced from publicly
            available third-party providers. For removal requests, see our DMCA policy.
          </p>
          <a href="https://dsc.gg/flyanime" target="_blank" rel="noopener noreferrer" style={s.discordBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Join our Discord
          </a>
        </div>

        {/* Links */}
        {Object.entries(LINKS).map(([group, items]) => (
          <div key={group} style={s.col}>
            <h4 style={s.colHead}>{group}</h4>
            {items.map(item => (
              <Link
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                style={s.colLink}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div style={s.bottom}>
        <p style={s.copy}>© {new Date().getFullYear()} Fly Anime. All rights reserved.</p>
        <div style={s.bottomLinks}>
          <Link href="/privacy" style={s.bottomLink}>Privacy</Link>
          <Link href="/terms"   style={s.bottomLink}>Terms</Link>
          <Link href="/dmca"    style={s.bottomLink}>DMCA</Link>
        </div>
      </div>
    </footer>
  );
}

const s = {
  footer: { backgroundColor: "#0a0a0d", borderTop: "1px solid rgba(255,255,255,0.06)", fontFamily: "Inter,sans-serif", marginTop: "60px" },
  inner: { maxWidth: "1280px", margin: "0 auto", padding: "48px 24px 32px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "40px", flexWrap: "wrap" },
  brand: { maxWidth: "280px" },
  tagline: { color: "#606070", fontSize: "13px", lineHeight: 1.6, margin: "14px 0 10px" },
  disclaimer: { color: "#404050", fontSize: "11px", lineHeight: 1.6, margin: "0 0 16px" },
  discordBtn: { display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#5865F2", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" },
  col: { display: "flex", flexDirection: "column", gap: "10px" },
  colHead: { color: "#fff", fontSize: "13px", fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.8px" },
  colLink: { color: "#606070", fontSize: "13px", textDecoration: "none", transition: "color 0.15s" },
  bottom: { borderTop: "1px solid rgba(255,255,255,0.05)", maxWidth: "1280px", margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" },
  copy: { color: "#404050", fontSize: "12px", margin: 0 },
  bottomLinks: { display: "flex", gap: "20px" },
  bottomLink: { color: "#505060", fontSize: "12px", textDecoration: "none" },
};
