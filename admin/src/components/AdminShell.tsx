"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Home,
  Package,
  FileText,
  Shield,
  ScrollText,
  Users,
  LogOut,
  ChevronDown,
  Images,
  FolderKanban,
  MessageCircleQuestion,
  Star,
  BookOpen,
  BriefcaseBusiness,
  Handshake,
  MapPin,
  Inbox,
  Settings,
} from "lucide-react";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import type { SiteId } from "@/services/adminAPI";
import { clsx } from "clsx";

const THAILAND_NAV = [
  { href: "/", label: "Home Page", icon: Home },
  { href: "/products", label: "Products", icon: Package },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/blogs", label: "Blogs", icon: FileText },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms & Conditions", icon: ScrollText },
  { href: "/users", label: "Users", icon: Users },
];

const VARSOVIA_NAV = [
  { href: "/varsovia?resource=site", resource: "site", label: "Site Settings", icon: Settings },
  { href: "/varsovia?resource=products", resource: "products", label: "Products", icon: Package },
  { href: "/varsovia?resource=projects", resource: "projects", label: "Interior Projects", icon: FolderKanban },
  { href: "/varsovia?resource=blogs", resource: "blogs", label: "Blogs", icon: FileText },
  { href: "/varsovia?resource=faqs", resource: "faqs", label: "FAQs", icon: MessageCircleQuestion },
  { href: "/varsovia?resource=testimonials", resource: "testimonials", label: "Testimonials", icon: Star },
  { href: "/varsovia?resource=catalogues", resource: "catalogues", label: "Catalogues", icon: BookOpen },
  { href: "/varsovia?resource=showcases", resource: "showcases", label: "Showcases", icon: Images },
  { href: "/varsovia?resource=team-members", resource: "team-members", label: "Team", icon: BriefcaseBusiness },
  { href: "/varsovia?resource=partners", resource: "partners", label: "Partners", icon: Handshake },
  { href: "/varsovia?resource=showrooms", resource: "showrooms", label: "Showrooms", icon: MapPin },
  { href: "/varsovia?resource=contacts", resource: "contacts", label: "Contact Leads", icon: Inbox },
];

const SITES: { id: SiteId; name: string }[] = [
  { id: "thailand-kitchen", name: "Thailand Kitchen" },
  { id: "varsovia-kitchen", name: "Varsovia Kitchen" },
];

type AdminShellProps = {
  children: React.ReactNode;
  title: string;
};

export default function AdminShell(props: AdminShellProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F5F7] p-8 text-sm text-[#6B7280]">
          Loading admin…
        </div>
      }
    >
      <AdminShellContent {...props} />
    </Suspense>
  );
}

function AdminShellContent({
  children,
  title,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, siteId, setSiteId } = useAdminAuth();
  const isVarsovia = siteId === "varsovia-kitchen";
  const nav = isVarsovia ? VARSOVIA_NAV : THAILAND_NAV;

  useEffect(() => {
    if (isVarsovia && !pathname.startsWith("/varsovia")) {
      router.replace("/varsovia?resource=site");
    } else if (!isVarsovia && pathname.startsWith("/varsovia")) {
      router.replace("/");
    }
  }, [isVarsovia, pathname, router]);

  const isActive = (item: { href: string; resource?: string }) => {
    if (item.resource) {
      return (
        pathname === "/varsovia" &&
        (searchParams.get("resource") || "site") === item.resource
      );
    }
    return item.href === "/"
      ? pathname === "/"
      : pathname.startsWith(item.href);
  };

  const changeSite = (next: SiteId) => {
    setSiteId(next);
    router.push(
      next === "varsovia-kitchen" ? "/varsovia?resource=site" : "/"
    );
  };

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
          {nav.map((item) => {
            const { href, label, icon: Icon } = item;
            return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item)
                  ? "bg-[#EEF0F3] text-[#1A2332]"
                  : "text-[#5C6370] hover:bg-[#F5F6F8] hover:text-[#1A2332]"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
            );
          })}
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
                onChange={(e) => changeSite(e.target.value as SiteId)}
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
