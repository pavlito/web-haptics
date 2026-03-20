"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { haptics } from "bzzz";

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
    haptics.setOutput("both");
    return () => { haptics.setOutput("auto"); };
  }, []);

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
              <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/github.svg`} alt="" width={16} height={16} />
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
