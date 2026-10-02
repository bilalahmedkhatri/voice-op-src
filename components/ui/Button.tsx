import React from 'react';
import Link from 'next/link';
import { FiRefreshCw } from 'react-icons/fi';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'danger' | 'dangerSoft' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  hideTextOnMobile?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white shadow-xs disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 border border-transparent',
  secondary:
    'bg-white border border-slate-200 hover:bg-orange-50/50 hover:border-[#ff9b8f]/60 text-slate-700 shadow-2xs disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400',
  soft:
    'bg-orange-50 hover:bg-orange-100 text-[#c83a2a] border border-orange-200/80 disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-xs border border-transparent disabled:bg-red-300',
  dangerSoft:
    'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent disabled:text-slate-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1',
  sm: 'h-8 px-3 text-xs font-semibold rounded-xl gap-1.5',
  md: 'h-9 px-3.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'h-10 px-5 text-sm font-bold rounded-xl gap-2',
};

const mobileIconBoxStyles: Record<ButtonSize, string> = {
  xs: 'max-sm:px-0 max-sm:w-7 max-sm:h-7',
  sm: 'max-sm:px-0 max-sm:w-8 max-sm:h-8',
  md: 'max-sm:px-0 max-sm:w-9 max-sm:h-9',
  lg: 'max-sm:px-0 max-sm:w-10 max-sm:h-10',
};

const iconSizes: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-4 h-4',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  href,
  target,
  rel,
  hideTextOnMobile = false,
  className = '',
  children,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center transition-all cursor-pointer select-none flex-shrink-0 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9b8f]/40';
  
  const responsiveClasses = hideTextOnMobile ? mobileIconBoxStyles[size] : '';
  const combinedClasses = `${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${responsiveClasses} ${className}`.trim();

  const renderedIcon = isLoading ? (
    <FiRefreshCw className={`${iconSizes[size]} animate-spin shrink-0`} />
  ) : icon ? (
    <span className="shrink-0 flex items-center justify-center">{icon}</span>
  ) : null;

  const content = (
    <>
      {iconPosition === 'left' && renderedIcon}
      {children && <span className={`truncate ${hideTextOnMobile ? 'hidden sm:inline' : ''}`}>{children}</span>}
      {iconPosition === 'right' && renderedIcon}
    </>
  );

  if (href && !disabled && !isLoading) {
    return (
      <Link href={href} target={target} rel={rel} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={combinedClasses}
      {...rest}
    >
      {content}
    </button>
  );
}
