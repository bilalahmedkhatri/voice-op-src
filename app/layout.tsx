import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";


export const metadata: Metadata = {
  metadataBase: new URL("https://genzee.video"),
  title: {
    default: "GenZee — AI Voice & Content Automation Studio",
    template: "%s | GenZee Video",
  },
  description:
    "GenZee (genzee.video) is the all-in-one AI content studio for creators, agencies, and marketers. Transform text into lifelike voiceovers, automate Facebook & Instagram posts, brainstorm YouTube strategies, and orchestrate campaigns with multi-model AI.",
  keywords: [
    "GenZee",
    "genzee.video",
    "AI voice generator",
    "text to speech",
    "social media automation",
    "Facebook reels scheduler",
    "Instagram content automation",
    "YouTube script strategy",
    "TTS studio",
    "ElevenLabs",
    "Gemini Voice",
    "Fish Audio",
    "creator OS",
    "content marketing automation",
    "TikTok script generator",
  ],
  authors: [{ name: "GenZee Video", url: "https://genzee.video" }],
  creator: "GenZee Video",
  publisher: "GenZee Video",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://genzee.video",
    title: "GenZee — AI Voice & Content Automation Studio",
    description:
      "Transform text into lifelike voiceovers, automate Facebook & Instagram posts, and generate multi-platform video content in seconds.",
    siteName: "GenZee Video",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GenZee AI Voice & Content Automation Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GenZee — AI Voice & Content Automation Studio",
    description:
      "Transform text into lifelike voiceovers, automate Facebook & Instagram posts, and generate multi-platform video content in seconds.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://genzee.video",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ff7d6e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'GenZee Video Studio',
              url: 'https://genzee.video',
              description:
                'All-in-one AI voice synthesis and multi-platform content automation studio for YouTube, Facebook, Instagram, and TikTok creators.',
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Any',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              featureList: [
                'Multi-model text to speech conversion (ElevenLabs, Fish Audio and Google Gemini)',
                'Automated Facebook & Instagram Reels publishing and scheduling',
                'YouTube long-form and Shorts content strategy orchestration',
                'Prompt-to-JSON campaign management and live template editor',
                'Dual-mode online cloud database and 100% offline IndexedDB storage',
              ],
            }),
          }}
        />
        <Analytics />
      </head>
      <body>
        {children}
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="qp2KBbEj214lhUA3JEg2aw" async></script>
      </body>
    </html>
  );
}
