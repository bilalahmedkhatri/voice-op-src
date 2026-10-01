"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiFileText,
  FiDatabase,
  FiSettings,
  FiMenu,
  FiX,
  FiLayout,
  FiMic,
  FiVideo,
  FiShare2,
  FiLink2,
} from "react-icons/fi";
import SidebarAuth from "../components/SidebarAuth";

interface NavLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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
      { name: "Voice Generator", href: "/", icon: FiMic },
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
      { name: "All Templates", href: "/templates", icon: FiDatabase },
      { name: "Settings", href: "/settings", icon: FiSettings },
    ],
  },
];

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <FiLayout className="w-6 h-6 text-[#ff7d6e]" />
            <span className="hidden md:block lg:block">Workspace</span>
          </Link>
          <button
            className="md:hidden text-slate-500 hover:text-slate-800"
            onClick={() => setIsMobileMenuOpen(false)}
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
                      link.href === "/"
                        ? pathname === "/"
                        : pathname === link.href || pathname?.startsWith(`${link.href}/`);
                    const Icon = link.icon;
                    return (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-orange-50/80 text-[#c83a2a] font-semibold border-l-2 border-[#ff7d6e]"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-[#ff7d6e]" : "text-slate-400"
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

          <SidebarAuth />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header for Mobile */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-500 hover:text-slate-800 focus:outline-none"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-slate-800">Workspace</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
