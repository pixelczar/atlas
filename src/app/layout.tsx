import type { Metadata } from 'next';
import { Public_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';

const publicSans = Public_Sans({ 
  subsets: ['latin'],
  variable: '--font-public-sans',
});

const instrumentSerif = Instrument_Serif({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
});

export const metadata: Metadata = {
  title: 'Atlas - Visual Sitemap Explorer',
  description:
    'A tool to visualize website sitemaps as a zoomable, draggable graph with realtime collaboration.',
  keywords: ['sitemap', 'visualization', 'collaboration', 'web development'],
  authors: [{ name: 'Atlas Team' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${publicSans.variable} ${instrumentSerif.variable} bg-white font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
