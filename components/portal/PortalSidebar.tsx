"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  code: string;
  disabled?: boolean;
};

export default function PortalSidebar({
  companyName,
  companySlug,
  userEmail,
}: {
  companyName: string;
  companySlug: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const base = `/portal/${companySlug}`;
  const items: NavItem[] = [
    { href: `${base}/overview`, label: "OVERVIEW", code: "01" },
    { href: `${base}/agents`, label: "AGENTS", code: "02", disabled: true },
    { href: `${base}/alerts`, label: "ALERTS", code: "03", disabled: true },
    { href: `${base}/data`, label: "DATA", code: "04", disabled: true },
    { href: `${base}/settings`, label: "SETTINGS", code: "05", disabled: true },
  ];

  return (
    <aside className="side">
      <div className="side-brand">
        <div className="side-brand-tag">◉ PORTAL</div>
        <div className="side-brand-name">{companyName}</div>
        <div className="side-brand-slug">/{companySlug}</div>
      </div>

      <nav className="side-nav">
        {items.map((i) => {
          if (i.disabled) {
            return (
              <div key={i.href} className="side-link disabled">
                <span className="side-code">{i.code}</span>
                <span>{i.label}</span>
                <span className="side-soon">SOON</span>
              </div>
            );
          }
          const active = pathname === i.href;
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`side-link${active ? " active" : ""}`}
            >
              <span className="side-code">{i.code}</span>
              <span>{i.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="side-foot">
        <div className="side-user">
          <div className="side-user-dot" />
          <div className="side-user-email">{userEmail}</div>
        </div>
        <form action="/auth/signout" method="post">
          <button className="side-signout" type="submit">
            ▶ SIGN OUT
          </button>
        </form>
      </div>

      <style jsx>{`
        .side {
          width: 240px;
          min-height: 100vh;
          background: var(--bg-2);
          border-right: 1px solid var(--fg-5);
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          font-family: var(--font-mono);
          position: sticky;
          top: 0;
        }
        .side-brand {
          padding: 0 24px 24px;
          border-bottom: 1px solid var(--fg-5);
        }
        .side-brand-tag {
          font-size: 10px;
          letter-spacing: 0.3em;
          color: var(--green);
          margin-bottom: 8px;
        }
        .side-brand-name {
          font-family: var(--font-brand);
          font-weight: 700;
          font-size: 18px;
          color: var(--fg);
        }
        .side-brand-slug {
          font-size: 11px;
          color: var(--fg-3);
          margin-top: 2px;
          letter-spacing: 0.1em;
        }
        .side-nav {
          flex: 1;
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .side-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 24px;
          font-size: 12px;
          letter-spacing: 0.2em;
          color: var(--fg-2);
          text-decoration: none;
          border-left: 2px solid transparent;
          transition: all 0.2s;
        }
        .side-link:hover:not(.disabled) {
          background: var(--bg-3);
          color: var(--fg);
        }
        .side-link.active {
          background: var(--bg-3);
          color: var(--green);
          border-left-color: var(--green);
        }
        .side-link.disabled {
          color: var(--fg-5);
          cursor: not-allowed;
        }
        .side-code {
          color: var(--fg-3);
          font-weight: 500;
          min-width: 24px;
        }
        .side-link.active .side-code {
          color: var(--amber);
        }
        .side-soon {
          margin-left: auto;
          font-size: 9px;
          color: var(--fg-5);
          letter-spacing: 0.15em;
        }
        .side-foot {
          padding: 16px 24px;
          border-top: 1px solid var(--fg-5);
        }
        .side-user {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .side-user-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 8px var(--green);
        }
        .side-user-email {
          font-size: 10px;
          color: var(--fg-3);
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .side-signout {
          width: 100%;
          background: transparent;
          border: 1px solid var(--fg-5);
          color: var(--fg-3);
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .side-signout:hover {
          border-color: var(--danger);
          color: var(--danger);
        }
      `}</style>
    </aside>
  );
}
