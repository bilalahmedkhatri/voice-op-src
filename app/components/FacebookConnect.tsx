'use client';

import { useState, useEffect } from 'react';
import { FaFacebook } from 'react-icons/fa';

interface FacebookConnectProps {
  onPagesFetched: (pages: any[]) => void;
}

// Ensure TypeScript knows about window.FB
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export default function FacebookConnect({ onPagesFetched }: FacebookConnectProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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
      if (response && !response.error && response.data && response.data.length > 0) {
        onPagesFetched(response.data);
      } else {
        setError('No pages found or failed to fetch pages. Ensure you have granted the necessary permissions.');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-gray-100 rounded-2xl bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Connect Facebook Page</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm w-full text-center border border-red-200">
          {error}
        </div>
      )}

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
    </div>
  );
}
