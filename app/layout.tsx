import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";


export const metadata: Metadata = {
  metadataBase: new URL("https://freevoiceover.vercel.app"),
  title: "AI Voiceover Generator - Free Text to Speech Tool",
  description:
    "Create professional voiceovers with customizable voice, speed, pitch, and volume.",
  keywords: [
    "voiceover generator",
    "text to speech",
    "TTS",
    "AI voice",
    "speech synthesis",
    "voice generator",
    "audio generator",
    "free voiceover tool",
  ],
  authors: [{ name: "Voice Generator Free" }],
  creator: "Voice Generator Free",
  publisher: "Voice Generator Free",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://freevoiceover.vercel.app",
    title: "AI Voiceover Generator",
    description:
      "Create professional voiceovers with customizable parameters.",
    siteName: "AI Voiceover Generator",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Voiceover Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/twitter-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#667eea",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="http://localhost:8000" />
        <link rel="dns-prefetch" href="http://localhost:8000" />
        {/* <script src="https://quge5.com/88/tag.min.js" data-zone="203992" async data-cfasync="false"></script> */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'AI Voiceover Generator',
              url: 'https://freevoiceover.vercel.app',
              description: 'Free online text-to-speech voiceover generator with customizable voice parameters',
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Any',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              featureList: [
                'Text to speech conversion',
                'Multiple voice options',
                'Adjustable speech rate',
                'Customizable pitch',
                'Volume control',
                'Save and manage prompts',
              ],
            }),
          }}
        />
        <Analytics />
      </head>
      <body>{children}</body>
    </html>
  );
}
