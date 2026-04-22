import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PortalIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find the user's first company (ordered by role grant, then name).
  const { data: roles } = await supabase
    .from("user_roles")
    .select("company_id, companies(slug)")
    .eq("user_id", user.id)
    .limit(1);

  const firstRole = roles?.[0] as
    | { company_id: string; companies: { slug: string } | { slug: string }[] | null }
    | undefined;
  const rel = firstRole?.companies;
  const firstSlug = Array.isArray(rel) ? rel[0]?.slug : rel?.slug;

  if (firstSlug) {
    redirect(`/portal/${firstSlug}/overview`);
  }

  // Admin without a company binding — fall back to camptec as the demo tenant.
  redirect("/portal/camptec/overview");
}
