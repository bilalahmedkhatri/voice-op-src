import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 sm:p-6 space-y-4 ${className}`}>
      {children}
    </div>
  );
}
