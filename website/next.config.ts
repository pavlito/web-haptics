import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGhPages ? "/bzzz" : "",
  assetPrefix: isGhPages ? "/bzzz/" : "",
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: isGhPages ? "/bzzz" : "",
  },
  turbopack: {
    root: path.join(configDir, ".."),
  },
};

export default nextConfig;
