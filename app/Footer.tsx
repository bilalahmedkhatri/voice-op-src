'use client';

import React from 'react';
import Link from 'next/link';
import { FaHeart } from 'react-icons/fa';

const footerLinks = [
  { href: '/about-us', text: 'About Us' },
  { href: '/contact-us', text: 'Contact Us' },
  { href: '/faq', text: 'FAQ' },
  { href: '/terms-of-service', text: 'Terms of Service' },
  { href: '/privacy-policy', text: 'Privacy Policy' },
  { href: '/blog', text: 'Blog' },
];

export default function Footer() {
  return (
    <footer className="w-full text-center py-8 px-4 text-xs sm:text-sm text-slate-500 bg-white/60 border-t border-slate-200/80 backdrop-blur-xs">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
        {/* Navigation links */}
        <nav className="flex justify-center gap-4 sm:gap-6 flex-wrap">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-600 hover:text-[#c83a2a] font-medium transition-colors cursor-pointer"
            >
              {link.text}
            </Link>
          ))}
        </nav>

        {/* Branding & credits */}
        <div className="flex flex-col items-center gap-1.5 text-xs text-slate-400">
          <p className="flex items-center gap-1.5 justify-center">
            <span>Made with</span>
            <FaHeart className="text-[#ff7d6e] text-xs" />
            <span>using</span>
            <a
              href="https://www.azeemlab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-700 hover:text-[#c83a2a] transition-colors"
            >
              AzeemLAB API
            </a>
          </p>
          <p>&copy; {new Date().getFullYear()} GenZee Video (<a href="https://genzee.video" className="hover:text-slate-600 transition-colors">genzee.video</a>). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}