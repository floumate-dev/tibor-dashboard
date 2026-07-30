import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  // Single-tenant deployments (e.g. Tibor's own Vercel project) set
  // TENANT_HOME_REDIRECT so the bare domain lands on that tenant's dashboard
  // instead of the multi-tenant Supabase login. Other deployments leave it
  // unset and keep the default auth-based routing.
  const tenantHome = process.env.TENANT_HOME_REDIRECT;
  if (tenantHome) {
    redirect(tenantHome);
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
