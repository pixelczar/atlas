import type { Metadata } from 'next';
import { Public_Sans, Oranienbaum } from 'next/font/google';
import './globals.css';

const publicSans = Public_Sans({ 
  subsets: ['latin'],
  variable: '--font-public-sans',
});

const oranienbaum = Oranienbaum({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-oranienbaum',
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
      <body className={`${publicSans.variable} ${oranienbaum.variable} bg-white font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
