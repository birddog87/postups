import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostUps - Your League, Posted",
  description:
    "The simplest way to track standings, scores, and schedules for your sports league. Game over? Post it up.",
  keywords: ["sports league", "standings", "scores", "schedule", "rec league"],
  openGraph: {
    title: "PostUps - Your League, Posted",
    description: "The simplest way to track standings, scores, and schedules for your sports league.",
    url: "https://postups.vercel.app",
    siteName: "PostUps",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PostUps - Sports League Standings",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PostUps - Your League, Posted",
    description: "The simplest way to track standings, scores, and schedules for your sports league.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
