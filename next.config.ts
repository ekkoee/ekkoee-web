import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 去掉 Next.js 的 powered-by header(省幾個 bytes + 安全)
  poweredByHeader: false,
  // 生產環境開 gzip / brotli(預設 true,這裡寫明避免誤關)
  compress: true,
  // 關掉 production source map 減少 build 產物大小 / 加速部署
  productionBrowserSourceMaps: false,
  // tree-shake 掉用不到的 framer-motion / three 子模組
  experimental: {
    optimizePackageImports: ["framer-motion", "three"],
  },
  async headers() {
    return [
      // Link headers for agent discovery (RFC 8288)
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value: [
              '</sitemap.xml>; rel="sitemap"; type="application/xml"',
              '</.well-known/agent-skills/index.json>; rel="agent-skills"',
              '</.well-known/api-catalog>; rel="api-catalog"',
            ].join(", "),
          },
        ],
      },
      // Correct content-type for well-known files
      {
        source: "/.well-known/agent-skills/index.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/.well-known/mcp/server-card.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      // 靜態資源(/public/*)快取 1 年,immutable
      {
        source: "/:path*.(png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  // Redirect apex → www (canonical is www.ekkoee.com)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "ekkoee.com",
          },
        ],
        destination: "https://www.ekkoee.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
