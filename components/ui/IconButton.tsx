import React from 'react';
import Link from 'next/link';
import { FiRefreshCw } from 'react-icons/fi';

export type IconButtonVariant = 'primary' | 'secondary' | 'soft' | 'danger' | 'ghost';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  title: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white shadow-xs border border-transparent disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400',
  secondary:
    'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 shadow-2xs disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400',
  soft:
    'bg-orange-50 hover:bg-orange-100 text-[#c83a2a] border border-orange-200/80 disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent disabled:text-red-300',
  ghost:
    'text-slate-400 hover:text-[#c83a2a] hover:bg-slate-100 border border-transparent disabled:text-slate-300',
};

const sizeStyles: Record<IconButtonSize, { box: string; icon: string }> = {
  xs: { box: 'w-7 h-7 rounded-lg', icon: 'text-xs' },
  sm: { box: 'w-8 h-8 rounded-lg', icon: 'text-sm' },
  md: { box: 'w-9 h-9 rounded-xl', icon: 'text-base' },
  lg: { box: 'w-10 h-10 rounded-xl', icon: 'text-lg' },
};

export default function IconButton({
  icon,
  title,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  href,
  target,
  rel,
  className = '',
  type = 'button',
  onClick,
  ...rest
}: IconButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center transition-all cursor-pointer select-none flex-shrink-0 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9b8f]/40';
  const sizeConfig = sizeStyles[size];
  const combinedClasses = `${baseClasses} ${sizeConfig.box} ${variantStyles[variant]} ${className}`.trim();

  const content = isLoading ? (
    <FiRefreshCw className="w-4 h-4 animate-spin shrink-0" />
  ) : (
    <span className="shrink-0 flex items-center justify-center">{icon}</span>
  );

  if (href && !disabled && !isLoading) {
    return (
      <Link href={href} title={title} aria-label={title} target={target} rel={rel} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={combinedClasses}
      {...rest}
    >
      {content}
    </button>
  );
}
