'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { FaSignOutAlt, FaUserCircle, FaBolt, FaLaptopCode } from 'react-icons/fa';
import { DbUser } from '../lib/db/types';
import { isDatabaseEnabled } from '../lib/config';

interface AuthButtonProps {
  onAuthChange?: (user: DbUser | null) => void;
}

// Official Google 4-color G Logo SVG
function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

const AuthButton = memo(function AuthButton({ onAuthChange }: AuthButtonProps) {
  const [user, setUser] = useState<DbUser | null>(null);
  const [quota, setQuota] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dbEnabled, setDbEnabled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isEnabled = isDatabaseEnabled();
    setDbEnabled(isEnabled);

    if (!isEnabled) {
      setLoading(false);
      return;
    }

    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setQuota(data.quota);
        onAuthChange?.(data.user);
      } else {
        setUser(null);
        setQuota(null);
        onAuthChange?.(null);
      }
    } catch {
      setUser(null);
      setQuota(null);
      onAuthChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      setQuota(null);
      setMenuOpen(false);
      onAuthChange?.(null);
      window.location.reload();
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  if (loading) {
    return (
      <div className="h-10 w-36 bg-white/60 animate-pulse rounded-2xl shadow-xs" />
    );
  }

  // Offline / Local Mode Badge when DB is disabled
  if (!dbEnabled) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-white/90 text-emerald-800 border border-emerald-200 shadow-sm backdrop-blur-xs"
        title="Running 100% locally with offline IndexedDB history storage"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <FaLaptopCode className="text-emerald-600 text-sm" />
        <span>Local / Offline Mode</span>
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href="/api/auth/google"
        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-white text-gray-800 border border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/90 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        title="Sign in with Google"
      >
        <GoogleIcon className="w-4 h-4" />
        <span>Sign in with Google</span>
      </a>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white text-gray-900 border border-gray-200/90 hover:border-gray-300 shadow-sm hover:shadow-md transition-all cursor-pointer"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-7 h-7 rounded-full object-cover ring-2 ring-[#ff9b8f]/50"
          />
        ) : (
          <FaUserCircle className="w-7 h-7 text-gray-400" />
        )}
        <span className="text-xs font-bold text-gray-800 max-w-[140px] truncate">
          {user.name || user.email}
        </span>
        {quota && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/60">
            {Math.max(0, (quota.max_daily_generations || 5) - (quota.generations_used || 0))}/{quota.max_daily_generations || 5}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn text-left">
          {/* User Info Header */}
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900 truncate">{user.name || 'Account'}</p>
            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
            
            {quota && (
              <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-600">
                <span className="flex items-center gap-1">
                  <FaBolt className="text-amber-500 text-[10px]" />
                  <span>Today's Limit:</span>
                </span>
                <span className="font-bold text-gray-800">
                  {Math.max(0, (quota.max_daily_generations || 5) - (quota.generations_used || 0))} / {quota.max_daily_generations || 5} left
                </span>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
});

export default AuthButton;
