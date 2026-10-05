import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  metadataBase: new URL("https://www.genzee.video"),
  title: {
    default: "GenZee | AI Voice & Content Automation Studio",
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
  authors: [{ name: "GenZee Video", url: "https://www.genzee.video" }],
  creator: "GenZee Video",
  publisher: "GenZee Video",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://www.genzee.video",
    title: "GenZee | AI Voice & Content Automation Studio",
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
    title: "GenZee | AI Voice & Content Automation Studio",
    description:
      "Transform text into lifelike voiceovers, automate Facebook & Instagram posts, and generate multi-platform video content in seconds.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://www.genzee.video",
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
        <meta name="ahrefs-site-verification" content="30231419b3e40319f15735ba0552cc64ddcf537c2825370f4e87d6f57828ddec"></meta>
        {/*  Google tag (gtag.js)  */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-YHG27Q1JE4" />
        <script
          id="google-tag-manager"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-YHG27Q1JE4');
            `,
          }}
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://www.genzee.video/#organization',
                  name: 'GenZee Video Studio',
                  url: 'https://www.genzee.video',
                  logo: 'https://www.genzee.video/icon-512.png',
                  sameAs: ['https://www.genzee.video'],
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://www.genzee.video/#website',
                  url: 'https://www.genzee.video',
                  name: 'GenZee Video',
                  description:
                    'All-in-one AI voice synthesis and multi-platform content automation studio for YouTube, Facebook, Instagram, and TikTok creators.',
                  publisher: { '@id': 'https://www.genzee.video/#organization' },
                },
              ],
            }),
          }}
        />
        <Analytics />
      </head>
      <body>
        {children}
        <SpeedInsights />
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="qp2KBbEj214lhUA3JEg2aw" async></script>
      </body>
    </html>
  );
}
