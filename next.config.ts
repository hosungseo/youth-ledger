import type { NextConfig } from "next";

// GitHub Pages serves this as a static export under /youth-ledger.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/youth-ledger";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
