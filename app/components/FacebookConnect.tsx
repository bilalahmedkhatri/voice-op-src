'use client';

import { useState, useEffect } from 'react';
import { FaFacebook } from 'react-icons/fa';

interface FacebookConnectProps {
  onPagesFetched: (pages: any[]) => void;
}

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export default function FacebookConnect({ onPagesFetched }: FacebookConnectProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
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
          appId: process.env.NEXT_PUBLIC_FB_APP_ID || '',
          cookie: true,
          xfbml: true,
          version: 'v21.0',
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
    setStatusText('Connecting to Meta...');
    setError(null);

    // Request permissions for Pages, Reels/Videos, and Instagram Professional accounts
    const requestedScopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'publish_video',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',');

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          setStatusText('Discovering connected pages & Instagram profiles...');
          fetchAndStorePages();
        } else {
          setIsConnecting(false);
          setStatusText(null);
          setError('User cancelled login or did not authorize required permissions.');
        }
      },
      { scope: requestedScopes }
    );
  };

  const fetchAndStorePages = () => {
    window.FB.api('/me/accounts', async (response: any) => {
      if (response && !response.error && response.data && response.data.length > 0) {
        setStatusText('Saving pages & tokens to database...');
        try {
          // Persist each page token in Neon DB and FastAPI
          for (const page of response.data) {
            await fetch('/api/facebook/store-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                page_id: page.id,
                page_name: page.name,
                access_token: page.access_token,
              }),
            });
          }

          // Fetch freshly stored pages from our Neon DB (including linked Instagram info)
          const pagesRes = await fetch('/api/facebook/pages');
          const pagesData = await pagesRes.json();

          setIsConnecting(false);
          setStatusText(null);

          if (pagesData.pages && pagesData.pages.length > 0) {
            onPagesFetched(pagesData.pages);
          } else {
            onPagesFetched(response.data);
          }
        } catch (saveErr) {
          console.error('Error saving page tokens to server:', saveErr);
          setIsConnecting(false);
          setStatusText(null);
          onPagesFetched(response.data);
        }
      } else {
        setIsConnecting(false);
        setStatusText(null);
        setError('No Facebook Pages found. Ensure you manage at least one page and have granted permissions.');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 border border-slate-200 rounded-2xl bg-white shadow-2xs">
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mb-3">
        f
      </div>
      <h3 className="text-lg font-bold mb-1 text-slate-800">Connect Facebook & Instagram</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs w-full text-center border border-red-200">
          {error}
        </div>
      )}

      {statusText && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs w-full text-center border border-blue-200 animate-pulse">
          {statusText}
        </div>
      )}

      <p className="text-slate-500 mb-6 text-center text-xs max-w-sm">
        Link your Facebook Pages and connected Instagram accounts to schedule Reels, Shorts, photos, and status updates directly.
      </p>

      <button
        onClick={handleConnect}
        disabled={!isLoaded || isConnecting}
        className="w-full sm:w-auto px-6 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <FaFacebook className="text-base" />
        <span>{isConnecting ? 'Authorizing with Meta...' : 'Connect with Facebook & Instagram'}</span>
      </button>
    </div>
  );
}
