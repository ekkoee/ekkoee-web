import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const body = {
    linkset: [
      {
        anchor: "https://www.ekkoee.com/api",
        "service-doc": [
          {
            href: "https://www.ekkoee.com/docs/api",
            type: "text/html",
            title: "ekkoee API documentation (coming soon)",
          },
        ],
        status: [
          {
            href: "https://www.ekkoee.com/api/health",
            type: "application/json",
            title: "API health endpoint (coming soon)",
          },
        ],
      },
    ],
    _comment:
      "When the ekkoee API is live, add a 'service-desc' entry pointing to the OpenAPI spec.",
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
