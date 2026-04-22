import { redirect } from "next/navigation";
import BackgroundFX from "@/components/ui/BackgroundFX";
import { createClient } from "@/lib/supabase/server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Second line of defense; middleware already redirects unauth traffic.
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <BackgroundFX />
      {children}
    </>
  );
}
