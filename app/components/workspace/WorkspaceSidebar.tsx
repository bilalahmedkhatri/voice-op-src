"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiFileText, FiDatabase, FiSettings, FiX, FiMic, FiVideo, FiShare2, FiLink2, FiCreditCard, FiVolume2 } from "react-icons/fi";
import SidebarAuth from "../SidebarAuth";
import type { WalletBalance } from "../TopUpButton";

interface NavLink {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  badge?: string;
  badgeColor?: string;
  links: NavLink[];
}

const navSections: NavSection[] = [
  {
    title: "Studio",
    links: [
      { name: "Voice Generator", href: "/admin", icon: FiMic },
      { name: "Audio Library", href: "/audio-library", icon: FiVolume2 },
      { name: "JSON Generator", href: "/json-generator", icon: FiFileText },
    ],
  },
  {
    title: "YouTube",
    badge: "YT",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200/80",
    links: [
      { name: "YouTube Strategy", href: "/youtube/templates", icon: FiVideo },
    ],
  },
  {
    title: "Facebook",
    badge: "FB",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200/80",
    links: [
      { name: "Facebook Content", href: "/facebook/templates", icon: FiShare2 },
      { name: "Page Integration", href: "/facebook/integration", icon: FiLink2 },
    ],
  },
  {
    title: "General",
    links: [
      { name: "Pricing & Billing", href: "/billing", icon: FiCreditCard },
      { name: "All Templates", href: "/templates", icon: FiDatabase },
      { name: "Settings", href: "/settings", icon: FiSettings },
    ],
  },
];

export default function WorkspaceSidebar({ isOpen, onClose, onWalletChange }: { isOpen: boolean; onClose: () => void; onWalletChange: (wallet: WalletBalance | null) => void }) {
  const pathname = usePathname();
  return <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside id="workspace-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <Link href="/admin" className="flex items-center gap-2.5 text-xl font-bold text-slate-900 group">
            <img
              src="/logo.jpg"
              alt="GenZee Logo"
              className="w-8 h-8 rounded-lg object-cover shadow-xs group-hover:scale-105 transition-transform border border-slate-200"
            />
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight leading-none text-slate-900">GenZee</span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">Studio</span>
            </div>
          </Link>
          <button
            type="button" aria-label="Close sidebar" className="md:hidden text-slate-500 hover:text-slate-800"
            onClick={onClose}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)] flex flex-col justify-between">
          <div className="space-y-5">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{section.title}</span>
                  {section.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold border ${section.badgeColor}`}
                    >
                      {section.badge}
                    </span>
                  )}
                </div>
                <ul className="space-y-0.5">
                  {section.links.map((link) => {
                    const isActive =
                      link.href === "/admin"
                        ? pathname === "/admin"
                        : link.href === "/"
                          ? pathname === "/"
                          : pathname === link.href || pathname?.startsWith(`${link.href}/`);
                    const Icon = link.icon;
                    return (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive
                              ? "bg-orange-50/80 text-[#c83a2a] font-semibold border-l-2 border-[#ff7d6e]"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${isActive ? "text-[#ff7d6e]" : "text-slate-400"
                              }`}
                          />
                          <span>{link.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <SidebarAuth onWalletChange={onWalletChange} />
        </div>
      </aside>

  </>;
}
