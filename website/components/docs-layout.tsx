"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type DocsLayoutProps = {
  title: string;
  description: string;
  sections: { id: string; label: string }[];
  children: ReactNode;
};

const sidebarLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/editor", label: "Pattern Editor" },
];

export function DocsLayout({
  title,
  description,
  sections,
  children,
}: DocsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="docs">
      <aside className="docs-sidebar">
        <div className="docs-sidebar-top">
          <Link href="/" className="docs-logo">
            <strong>web-haptics</strong>{" "}
            <span className="docs-logo-by">by Pavle Lucic</span>
          </Link>
        </div>
        <nav className="docs-nav">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`docs-nav-link ${pathname === link.href ? "docs-nav-link-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="docs-sidebar-footer">
          <a href="https://github.com/pavlito/web-haptics" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </aside>

      <div className="docs-main">
        <article className="docs-content">
          <h1 className="docs-title">{title}</h1>
          <p className="docs-description">{description}</p>
          {children}
        </article>

        <aside className="docs-toc">
          <div className="docs-toc-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            On this page
          </div>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="docs-toc-link">
              {s.label}
            </a>
          ))}
        </aside>
      </div>
    </div>
  );
}
