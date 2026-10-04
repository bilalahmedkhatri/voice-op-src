'use client';

import React from 'react';
import Link from 'next/link';

interface NavLinkItem {
  label: string;
  href: string;
  badge?: string;
}

interface NavSection {
  title: string;
  links: NavLinkItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Multi-Model Voice Studio', href: '/admin' },
      { label: 'JSON Campaign Engine', href: '/json-generator' },
      { label: 'Social Publishing', href: '/facebook/integration', badge: 'Direct' },
      { label: 'YouTube Automation', href: '/youtube/templates' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Pricing & Packages', href: '/pricing' },
      { label: 'Creator Guides & Blog', href: '/blog' },
      { label: 'Frequently Asked Questions', href: '/faq' },
      { label: 'Contact & Support', href: '/contact-us' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About GenZee Video', href: '/about-us' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
    ],
  },
];

export default function FooterNavColumns() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
      {NAV_SECTIONS.map((section, idx) => (
        <div key={idx} className="space-y-3.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {section.title}
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-400">
            {section.links.map((link, lIdx) => (
              <li key={lIdx}>
                <Link
                  href={link.href}
                  className="hover:text-[#ff9b8f] transition-colors inline-flex items-center gap-1.5 group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {link.label}
                  </span>
                  {link.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/15 text-[#ff9b8f] font-mono border border-[#ff7d6e]/20">
                      {link.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
