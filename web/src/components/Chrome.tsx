import { Link, useLocation } from "react-router-dom";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="MindEase home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-lg text-white shadow-soft">
        ◍
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-ink-900"}`}>
        MindEase
      </span>
    </Link>
  );
}

const SECTION_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#therapists", label: "For therapists" },
];

export function Navbar() {
  const { pathname } = useLocation();
  const onLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        {onLanding ? (
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-600 md:flex">
            {SECTION_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-primary-600">
                {link.label}
              </a>
            ))}
          </nav>
        ) : (
          <Link to="/" className="text-sm font-medium text-ink-600 hover:text-primary-600">
            ← Back to mindease.com
          </Link>
        )}
        <div className="flex items-center gap-3">
          <Link to="/portal/login" className="btn-ghost hidden sm:inline-flex" data-testid="nav-therapist-login">
            Therapist login
          </Link>
          <a href="#download" className="btn-primary">
            Get the app
          </a>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink-400">
            Therapy that fits your life. Find the right therapist and book a secure Zoom
            session in minutes.
          </p>
        </div>
        <FooterColumn 
          title="Product"
          links={["Features", "How it works", "Download"]}
        />

      </div>
      <div className="border-t border-ink-100 py-6 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} MindEase. Serving clients in India. Not for emergencies —
        if you are in crisis, contact your local emergency services.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm text-ink-400">
        {links.map((link) => (
          <li key={link}>
            <a href="#" className="transition hover:text-primary-600">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base leading-7 text-ink-600">{subtitle}</p> : null}
    </div>
  );
}