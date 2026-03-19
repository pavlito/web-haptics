import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const caveat = Caveat({ subsets: ["latin"], display: "swap", variable: "--font-hand" });

export const metadata: Metadata = {
  title: "bzzz",
  description: "Haptic and audio feedback for the web.",
  metadataBase: new URL("https://pavlito.github.io/bzzz"),
  openGraph: {
    title: "bzzz",
    description: "Haptic and audio feedback for the web.",
    type: "website",
  },
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo-icon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${inter.className} ${caveat.variable}`}>
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
