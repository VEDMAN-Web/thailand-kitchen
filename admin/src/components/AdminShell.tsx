"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderOpen,
  Package,
  FileText,
  Shield,
  ScrollText,
  Users,
  LogOut,
  ChevronDown,
  Inbox,
  Images,
} from "lucide-react";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import type { SiteId } from "@/services/adminAPI";
import { clsx } from "clsx";

const NAV = [
  { href: "/", label: "Home Page", icon: Home },
  { href: "/contacts", label: "Contacts", icon: Inbox },
  { href: "/categories", label: "Categories", icon: FolderOpen },
  { href: "/products", label: "Products", icon: Package },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/blogs", label: "Blogs", icon: FileText },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms & Conditions", icon: ScrollText },
  { href: "/users", label: "Users", icon: Users },
];

const SITES: { id: SiteId; name: string }[] = [
  { id: "thailand-kitchen", name: "Thailand Kitchen" },
  { id: "varsovia-kitchen", name: "Varsovia Kitchen" },
];

export default function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const { user, logout, siteId, setSiteId } = useAdminAuth();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#1A1D26] flex">
      <aside className="w-[240px] shrink-0 bg-white border-r border-[#E8EAED] flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-[#E8EAED]">
          <div className="w-8 h-8 rounded-full bg-[#1A2332] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-bold tracking-wide text-[15px]">TRUSTPRIME</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-[#EEF0F3] text-[#1A2332]"
                  : "text-[#5C6370] hover:bg-[#F5F6F8] hover:text-[#1A2332]"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="m-3 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#E11D48] hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-[#E8EAED] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-sm font-bold tracking-[0.12em] uppercase truncate">
              {title}
            </h1>
            <div className="relative">
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value as SiteId)}
                className="appearance-none bg-[#F5F6F8] border border-[#E2E5EA] rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-[#1A2332] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1A2332]/20"
              >
                {SITES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            </div>
          </div>

          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#1A2332] text-white flex items-center justify-center text-xs font-semibold">
              {user?.initials || "TH"}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-white" />
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
