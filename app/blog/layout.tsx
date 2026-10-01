import React from 'react';
import Footer from '../Footer';
import BackButton from '../components/BackButton';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 font-sans">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 sm:py-12 md:py-16">
        <BackButton />
        {children}
      </main>
      <Footer />
    </div>
  );
}