import fs from 'fs';
import path from 'path';
import React from 'react';
import { ImageResponse } from 'next/og';

const PUBLIC_DIR = path.join(__dirname, '../public');
const APP_DIR = path.join(__dirname, '../app');

// 1. Vector SVG for web browsers and retina screens
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="gzGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff9b8f" />
      <stop offset="50%" stop-color="#ff7d6e" />
      <stop offset="100%" stop-color="#e04836" />
    </linearGradient>
    <linearGradient id="gzDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
  </defs>
  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="128" fill="url(#gzDark)" />
  <!-- Subtle border highlight -->
  <rect width="504" height="504" x="4" y="4" rx="124" fill="none" stroke="url(#gzGrad)" stroke-width="4" stroke-opacity="0.35" />
  
  <!-- GenZee Geometric GZ Emblem -->
  <!-- Modern G curve -->
  <path d="M 280 140 C 220 140 160 180 160 256 C 160 332 220 372 280 372 C 340 372 370 330 370 286 L 270 286 L 270 246 L 416 246 C 418 260 420 274 420 292 C 420 366 360 420 280 420 C 180 420 110 350 110 256 C 110 162 180 92 280 92 C 342 92 392 124 416 168 L 372 196 C 354 164 322 140 280 140 Z" fill="url(#gzGrad)" />
  
  <!-- Soundwave / Video bars on right -->
  <rect x="250" y="170" width="18" height="60" rx="9" fill="#ffffff" opacity="0.95" />
  <rect x="282" y="145" width="18" height="110" rx="9" fill="#ffffff" opacity="0.95" />
  <rect x="314" y="180" width="18" height="40" rx="9" fill="#ffffff" opacity="0.85" />
</svg>`;

async function main() {
  console.log('Generating GenZee brand assets...');

  // Save SVG icons
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), svgIcon, 'utf-8');
  fs.writeFileSync(path.join(APP_DIR, 'icon.svg'), svgIcon, 'utf-8');
  console.log('✓ Created public/icon.svg and app/icon.svg');

  // 2. Generate Apple Touch Icon (180x180 PNG)
  const appleIconResponse = new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090d16',
          borderRadius: '40px',
          border: '2px solid rgba(255, 125, 110, 0.4)',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '76px',
            fontWeight: 900,
            fontFamily: 'sans-serif',
            background: 'linear-gradient(135deg, #ff9b8f 0%, #ff7d6e 50%, #e04836 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-3px',
          },
        },
        'GZ'
      )
    ),
    { width: 180, height: 180 }
  );
  const appleIconBuf = Buffer.from(await appleIconResponse.arrayBuffer());
  fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), appleIconBuf);
  console.log('✓ Created public/apple-touch-icon.png (180x180)');

  // 3. Generate PWA 192x192 Icon
  const pwa192Response = new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: 192,
          height: 192,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090d16',
          borderRadius: '44px',
          border: '2px solid rgba(255, 125, 110, 0.4)',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '84px',
            fontWeight: 900,
            fontFamily: 'sans-serif',
            background: 'linear-gradient(135deg, #ff9b8f 0%, #ff7d6e 50%, #e04836 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-3px',
          },
        },
        'GZ'
      )
    ),
    { width: 192, height: 192 }
  );
  const pwa192Buf = Buffer.from(await pwa192Response.arrayBuffer());
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-192.png'), pwa192Buf);
  console.log('✓ Created public/icon-192.png (192x192)');

  // 4. Generate PWA 512x512 Icon
  const pwa512Response = new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: 512,
          height: 512,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090d16',
          borderRadius: '116px',
          border: '6px solid rgba(255, 125, 110, 0.4)',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              fontSize: '220px',
              fontWeight: 900,
              fontFamily: 'sans-serif',
              background: 'linear-gradient(135deg, #ff9b8f 0%, #ff7d6e 50%, #e04836 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-8px',
              lineHeight: 1,
            },
          },
          'GZ'
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '6px',
              color: '#94a3b8',
              marginTop: '12px',
            },
          },
          'GENZEE'
        )
      )
    ),
    { width: 512, height: 512 }
  );
  const pwa512Buf = Buffer.from(await pwa512Response.arrayBuffer());
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-512.png'), pwa512Buf);
  console.log('✓ Created public/icon-512.png (512x512)');

  // 5. Generate OpenGraph Image (1200x630 PNG)
  const ogResponse = new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          backgroundColor: '#080c14',
          fontFamily: 'sans-serif',
          position: 'relative',
        },
      },
      // Top row: Brand & Domain
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#ff7d6e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '28px',
                boxShadow: '0 4px 20px rgba(255, 125, 110, 0.4)',
              },
            },
            'GZ'
          ),
          React.createElement(
            'span',
            {
              style: {
                fontSize: '32px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.5px',
              },
            },
            'GenZee Video'
          )
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: '20px',
              fontWeight: 700,
              color: '#ff9b8f',
              backgroundColor: 'rgba(255, 125, 110, 0.12)',
              border: '1px solid rgba(255, 125, 110, 0.3)',
              padding: '8px 20px',
              borderRadius: '999px',
            },
          },
          'genzee.video'
        )
      ),

      // Middle: Main Headline & Subtitle
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxWidth: '1000px',
          },
        },
        React.createElement(
          'h1',
          {
            style: {
              fontSize: '56px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              margin: 0,
            },
          },
          'The AI Voice & Content Automation Studio for Modern Creators'
        ),
        React.createElement(
          'p',
          {
            style: {
              fontSize: '24px',
              color: '#94a3b8',
              lineHeight: 1.4,
              margin: 0,
            },
          },
          'Generate natural multi-model voiceovers, automate Facebook & Instagram Reels, and brainstorm YouTube strategies in minutes.'
        )
      ),

      // Bottom row: Capabilities Pill List
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          },
        },
        ['🎙 Multi-Model Voice Synthesis', '📱 Facebook & Instagram Automation', '🎬 YouTube Creator Pipeline', '⚡ Prompt-to-JSON Workflow'].map(
          (text, idx) =>
            React.createElement(
              'div',
              {
                key: idx,
                style: {
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '10px 18px',
                  borderRadius: '12px',
                },
              },
              text
            )
        )
      )
    ),
    { width: 1200, height: 630 }
  );
  const ogBuf = Buffer.from(await ogResponse.arrayBuffer());
  fs.writeFileSync(path.join(PUBLIC_DIR, 'og-image.png'), ogBuf);
  console.log('✓ Created public/og-image.png (1200x630)');

  console.log('All brand assets successfully generated!');
}

main().catch((err) => {
  console.error('Failed to generate brand assets:', err);
  process.exit(1);
});
