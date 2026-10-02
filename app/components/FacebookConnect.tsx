'use client';

import { useState, useEffect } from 'react';
import { FaFacebook, FaInstagram, FaCheckCircle } from 'react-icons/fa';

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

  // Toggle whether to request Instagram scopes alongside Facebook Page scopes
  const [includeInstagram, setIncludeInstagram] = useState(false);

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

  const handleConnect = (withInstagram = includeInstagram) => {
    if (!window.FB) return;
    setIsConnecting(true);
    setStatusText('Connecting to Meta...');
    setError(null);

    // Core Facebook Page scopes for publishing posts, photos, videos, and Reels
    // NOTE: 'publish_video' is deprecated by Meta and must NOT be included.
    const scopesList = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];

    if (withInstagram) {
      scopesList.push('instagram_basic', 'instagram_content_publish');
    }

    const requestedScopes = scopesList.join(',');

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          setStatusText('Discovering all connected pages & Instagram profiles...');
          fetchAndStorePages();
        } else {
          setIsConnecting(false);
          setStatusText(null);
          if (withInstagram) {
            setError(
              'Authorization was not completed. If Instagram scopes caused an issue, try connecting Facebook Pages only.'
            );
          } else {
            setError('User cancelled login or did not authorize required permissions.');
          }
        }
      },
      {
        scope: requestedScopes,
        auth_type: 'rerequest', // Forces Meta to prompt with Page selection so all pages can be opted-in
        return_scopes: true,
      }
    );
  };

  const fetchAndStorePages = () => {
    let allPages: any[] = [];

    const fetchBatch = (pathOrUrl: string) => {
      window.FB.api(pathOrUrl, async (response: any) => {
        if (response && !response.error && response.data && Array.isArray(response.data)) {
          allPages = allPages.concat(response.data);

          // If there is pagination next URL, continue fetching more pages
          if (response.paging && response.paging.next) {
            setStatusText(`Found ${allPages.length} pages, fetching more...`);
            fetchBatch(response.paging.next);
          } else {
            // Finished fetching all pages across all batches
            if (allPages.length > 0) {
              setStatusText(`Saving ${allPages.length} pages & tokens to database...`);
              await savePages(allPages);
            } else {
              setIsConnecting(false);
              setStatusText(null);
              setError(
                'No Facebook Pages found. Ensure you selected all pages in the Meta permissions dialog.'
              );
            }
          }
        } else if (allPages.length > 0) {
          // If a subsequent page failed, save what we already got
          await savePages(allPages);
        } else {
          setIsConnecting(false);
          setStatusText(null);
          setError(response?.error?.message || 'No Facebook Pages found or failed to fetch pages.');
        }
      });
    };

    fetchBatch('/me/accounts?limit=100');
  };

  const savePages = async (pages: any[]) => {
    try {
      let isUnauthorized = false;
      for (const page of pages) {
        const storeRes = await fetch('/api/facebook/store-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_id: page.id,
            page_name: page.name,
            access_token: page.access_token,
          }),
        });
        if (storeRes.status === 401) {
          isUnauthorized = true;
          break;
        }
      }

      if (isUnauthorized) {
        setIsConnecting(false);
        setStatusText(null);
        setError('Please sign in with Google first so your connected Facebook Pages can be securely saved to your account.');
        return;
      }

      const pagesRes = await fetch('/api/facebook/pages');
      if (pagesRes.status === 401) {
        setIsConnecting(false);
        setStatusText(null);
        setError('Please sign in with Google first so your connected Facebook Pages can be securely saved to your account.');
        return;
      }

      const pagesData = await pagesRes.json();

      setIsConnecting(false);
      setStatusText(null);

      if (pagesData.pages && pagesData.pages.length > 0) {
        onPagesFetched(pagesData.pages);
      } else {
        onPagesFetched(pages);
      }
    } catch (saveErr) {
      console.error('Error saving page tokens to server:', saveErr);
      setIsConnecting(false);
      setStatusText(null);
      onPagesFetched(pages);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8">
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

      <p className="text-slate-500 mb-5 text-center text-xs max-w-sm">
        Connect your Facebook Page to directly publish and schedule Reels, videos, photos, and updates.
      </p>

      {/* Permission Options Box */}
      <div className="w-full max-w-sm mb-5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-left">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <FaCheckCircle className="text-emerald-500 text-sm shrink-0" />
          <span>Facebook Page Permissions (Reels, Posts, Videos)</span>
        </div>

        <label className="flex items-start gap-2 pt-2 border-t border-slate-200/70 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeInstagram}
            onChange={(e) => setIncludeInstagram(e.target.checked)}
            className="w-4 h-4 text-pink-600 rounded-sm focus:ring-pink-500 cursor-pointer mt-0.5"
          />
          <div>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <FaInstagram className="text-pink-600" /> Also request Instagram publishing
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Requires Instagram Business Account linked to your Page
            </span>
          </div>
        </label>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
        <button
          onClick={() => handleConnect(includeInstagram)}
          disabled={!isLoaded || isConnecting}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <FaFacebook className="text-base" />
          <span>
            {isConnecting
              ? 'Authorizing with Meta...'
              : includeInstagram
              ? 'Connect Facebook & Instagram'
              : 'Connect Facebook Page'}
          </span>
        </button>
      </div>
    </div>
  );
}
