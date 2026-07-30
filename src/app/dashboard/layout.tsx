import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: appUser } = await supabase.from("app_users").select("role, org_id").eq("id", user.id).single();
  const role = appUser?.role || "client";

  let orgsQuery = supabase.from("organizations").select("*").order("name");
  if (role === "client" && appUser?.org_id) orgsQuery = orgsQuery.eq("id", appUser.org_id);
  const { data: organizations } = await orgsQuery;

  return (
    <div className="flex min-h-screen" style={{ background: "#0b0b14" }}>
      <Sidebar organizations={organizations || []} userRole={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header email={user.email || ""} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
