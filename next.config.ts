import type { NextConfig } from "next";
import pages from "./content/pages.json";
import posts from "./content/posts.json";
const config: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  async redirects() {
    return [
      ...pages.map((p) => ({
        source: `/${p.file}`,
        destination: p.slug === "home" ? "/" : `/${p.slug}`,
        permanent: true,
      })),
      ...posts.map((p) => ({
        source: `/${p.slug}.html`,
        destination: `/insights/${p.slug}`,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};
export default config;
