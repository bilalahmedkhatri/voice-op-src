'use client';

import { useState, useEffect } from 'react';
import { FaFacebook } from 'react-icons/fa';

interface FacebookConnectProps {
  onPageSelected: (pageId: string, pageName: string) => void;
}

// Ensure TypeScript knows about window.FB
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export default function FacebookConnect({ onPageSelected }: FacebookConnectProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Facebook SDK
    const loadFacebookSDK = () => {
      if (document.getElementById('facebook-jssdk')) {
        setIsLoaded(true);
        return;
      }

      window.fbAsyncInit = function () {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FB_APP_ID || '', // Needs to be configured in .env.local
          cookie: true,
          xfbml: true,
          version: 'v21.0'
        });
        setIsLoaded(true);
      };

      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.body.appendChild(js);
    };

    loadFacebookSDK();
  }, []);

  const handleConnect = () => {
    if (!window.FB) return;
    setIsConnecting(true);
    setError(null);

    window.FB.login((response: any) => {
      if (response.authResponse) {
        // User is logged in and granted permissions, now fetch their pages
        fetchPages();
      } else {
        setIsConnecting(false);
        setError('User cancelled login or did not fully authorize.');
      }
    }, { scope: 'pages_show_list,pages_read_engagement,pages_manage_posts' });
  };

  const fetchPages = () => {
    window.FB.api('/me/accounts', (response: any) => {
      setIsConnecting(false);
      if (response && !response.error) {
        setPages(response.data);
      } else {
        setError('Failed to fetch pages. Ensure you have granted the necessary permissions.');
      }
    });
  };

  const selectPage = async (page: any) => {
    setError(null);
    try {
      // Use VOICEOVER_API_URL or fallback
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v1/facebook/store-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: page.id,
          page_name: page.name,
          access_token: page.access_token
        })
      });

      if (res.ok) {
        onPageSelected(page.id, page.name);
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to store page token on the server.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred while connecting to the backend.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-gray-100 rounded-2xl bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Connect Facebook Page</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm w-full text-center border border-red-200">
          {error}
        </div>
      )}

      {pages.length === 0 ? (
        <>
          <p className="text-gray-600 mb-6 text-center text-sm">
            Link your Facebook Page to directly publish or schedule voiceovers and text updates.
          </p>
          <button
            onClick={handleConnect}
            disabled={!isLoaded || isConnecting}
            className="w-full sm:w-auto px-6 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FaFacebook className="text-lg" />
            <span>{isConnecting ? 'Connecting...' : 'Connect with Facebook'}</span>
          </button>
        </>
      ) : (
        <div className="w-full max-w-md">
          <p className="text-gray-700 font-medium mb-3 text-sm text-center">Select a page to connect:</p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {pages.map((page) => (
              <div 
                key={page.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-[#ff9b8f] hover:bg-red-50/30 transition-colors"
              >
                <span className="font-medium text-gray-800 truncate">{page.name}</span>
                <button
                  onClick={() => selectPage(page)}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#ff9b8f] to-[#ffb4a8] hover:from-[#f8887a] hover:to-[#ffa79a] text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md ml-4 shrink-0"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
