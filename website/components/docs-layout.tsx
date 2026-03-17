"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type DocsLayoutProps = {
  title: string;
  description: string;
  sections: { id: string; label: string }[];
  children: ReactNode;
};

export function DocsLayout({
  title,
  description,
  sections,
  children,
}: DocsLayoutProps) {
  return (
    <div className="docs">
      <div className="docs-main">
        <aside className="docs-toc">
          <Link href="/" className="docs-logo">
            <strong>web-haptics</strong>{" "}
            <span className="docs-logo-by">by Pavle Lucic</span>
          </Link>
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
          <div className="docs-toc-footer">
            <a href="https://github.com/pavlito/web-haptics" target="_blank" rel="noopener noreferrer" className="docs-toc-link">
              GitHub
            </a>
          </div>
        </aside>

        <article className="docs-content">
          <h1 className="docs-title">{title}</h1>
          <p className="docs-description">{description}</p>
          {children}
        </article>
      </div>
    </div>
  );
}
