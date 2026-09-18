"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiFileText, FiDatabase, FiSettings, FiMenu, FiX, FiLayout } from "react-icons/fi";

import SidebarAuth from "../components/SidebarAuth";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: FiHome },
  { name: "JSON Generator", href: "/dashboard/json-generator", icon: FiFileText },
  { name: "Saved Templates", href: "/dashboard/templates", icon: FiDatabase },
  { name: "Settings", href: "/dashboard/settings", icon: FiSettings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <FiLayout className="w-6 h-6 text-blue-600" />
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
          <ul className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* <div className="mt-auto"> */}
          <SidebarAuth />
          {/* </div> */}
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
