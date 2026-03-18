"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

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
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px" },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="docs">
      <div className="docs-main">
        <aside className="docs-toc">
          <Link href="/" className="docs-logo">
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo.svg`} alt="bzzz" height={20} />
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
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`docs-toc-link ${activeId === s.id ? "docs-toc-link-active" : ""}`}
            >
              {s.label}
            </a>
          ))}
          <div className="docs-toc-footer">
            <a href="https://github.com/pavlito/bzzz" target="_blank" rel="noopener noreferrer" className="docs-toc-github">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
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
