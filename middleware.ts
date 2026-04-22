import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     *  - _next/static            (bundled static assets)
     *  - _next/image             (image optimizer)
     *  - favicon.ico, sitemap.xml, robots.txt
     *  - .well-known/*           (agent-ready infra — must stay public)
     *  - image / font files
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)",
  ],
};
