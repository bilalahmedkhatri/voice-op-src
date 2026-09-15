'use client';

import { useState } from 'react';
import FacebookConnect from '../components/FacebookConnect';
import FacebookPostEditor from '../components/FacebookPostEditor';
import Footer from '../Footer';

export default function FacebookIntegrationPage() {
  const [connectedPages, setConnectedPages] = useState<any[]>([]);

  const handlePagesFetched = (pages: any[]) => {
    setConnectedPages(pages);
  };

  const handleDisconnect = () => {
    setConnectedPages([]);
  };

  const features = [
    { text: 'Direct Publishing' },
    { text: 'Post Scheduling' },
    { text: 'Seamless Integration' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 via-red-200 to-red-300 relative">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-200 to-red-300 text-gray-900 px-4 sm:px-8 md:px-16 pt-8 pb-8 sm:pt-10 sm:pb-12 md:pt-12 md:pb-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-transparent" />

        <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-8 md:px-16 flex flex-col items-center">
          
          {/* Header */}
          <div className="mb-6 flex justify-center">
             <a href="/" className="px-6 py-2.5 bg-white text-gray-800 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all">
                ← Back to Studio
             </a>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-gray-900 tracking-tight">
            Facebook Integration
          </h1>
          <p className="text-base sm:text-lg max-w-3xl mx-auto mb-8 text-gray-800 leading-relaxed font-normal px-4">
            Connect your Facebook Page to directly publish updates or schedule your voiceover content in advance. Manage your social presence effortlessly.
          </p>

          {/* Feature Pills */}
          <div className="flex gap-4 justify-center flex-wrap mt-2">
            {features.map((feature) => (
              <div
                key={feature.text}
                className="py-1.5 px-4 bg-[#ff9b8f]/25 rounded-full text-sm font-medium border border-[#ff9b8f]/35 text-gray-900 shadow-xs"
              >
                {feature.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full mx-auto p-4 sm:p-8 flex justify-center">
        {connectedPages.length === 0 ? (
          <div className="w-full max-w-screen-md">
            <section
              aria-label="Facebook Integration Workspace"
              className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-md mb-6 sm:mb-8 md:mb-12"
            >
              <FacebookConnect onPagesFetched={handlePagesFetched} />
            </section>
          </div>
        ) : (
          <div className="w-full mb-6 sm:mb-8 md:mb-12">
            <FacebookPostEditor 
              pages={connectedPages}
              onDisconnect={handleDisconnect} 
            />
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
