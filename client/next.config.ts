import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    const imageFilesOrigin = process.env.IMAGE_FILES_ORIGIN ?? "http://127.0.0.1:8091";
    return [
      {
        source: "/uploaded-images/:path*",
        destination: `${imageFilesOrigin.replace(/\/$/, "")}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
