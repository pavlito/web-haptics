import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "bzzz",
  description:
    "Haptic feedback for the web. Native vibration + audio fallback.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <main>{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            By{" "}
            <a href="https://github.com/pavlito" target="_blank" rel="noopener noreferrer" className="footer-link">
              Pavle Lucic
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
