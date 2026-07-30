"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Organization } from "@/types";

interface SidebarProps {
  organizations: Organization[];
  userRole: "admin" | "client";
}

export default function Sidebar({ organizations, userRole }: SidebarProps) {
  const pathname = usePathname();
  const active = (p: string, exact = false) => exact ? pathname === p : pathname.startsWith(p);

  const navItem = (href: string, label: string, exact: boolean, icon: React.ReactNode) => {
    const isActive = active(href, exact);
    return (
      <Link href={href} className="flex items-center gap-3 px-4 py-[10px] rounded-xl text-[13px] font-medium transition-all duration-200" style={{
        background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
        color: isActive ? "#c4b5fd" : "#6b6b80",
        borderLeft: isActive ? "2px solid #8b5cf6" : "2px solid transparent",
      }}>
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-[260px] min-h-screen flex flex-col" style={{ background: "#0e0e18", borderRight: "1px solid rgba(30,30,46,0.5)" }}>
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(30,30,46,0.5)" }}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
            <span className="text-white text-sm font-bold" style={{ letterSpacing: -1 }}>T</span>
          </div>
          <span className="text-[17px] font-bold tracking-tight" style={{ color: "#e8e8f0" }}>Tracking</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {userRole === "admin" && navItem("/dashboard", "Dashboard", true,
          <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        )}

        <div className="pt-5 pb-2">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#3a3a4e" }}>Klijenti</p>
        </div>
        {organizations.map((org) => (
          <Link key={org.id} href={`/dashboard/${org.slug}`}
            className="flex items-center gap-3 px-4 py-[10px] rounded-xl text-[13px] transition-all duration-200"
            style={{
              background: active(`/dashboard/${org.slug}`) ? "rgba(139,92,246,0.1)" : "transparent",
              color: active(`/dashboard/${org.slug}`) ? "#c4b5fd" : "#6b6b80",
              fontWeight: active(`/dashboard/${org.slug}`) ? 600 : 400,
              borderLeft: active(`/dashboard/${org.slug}`) ? "2px solid #8b5cf6" : "2px solid transparent",
            }}>
            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "#34d399" }} />
            {org.name}
          </Link>
        ))}

        {userRole === "admin" && (
          <>
            <div className="pt-5 pb-2">
              <p className="px-4 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#3a3a4e" }}>Admin</p>
            </div>
            {navItem("/settings", "Podešavanja", false,
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
