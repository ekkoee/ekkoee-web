import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
