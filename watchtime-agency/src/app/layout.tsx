import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import AttributionTracker from '@/components/AttributionTracker';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${SITE_NAME} — Done-for-You YouTube Content for Business Leaders`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — Done-for-You YouTube Content for Business Leaders`,
    description: SITE_DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Done-for-You YouTube Content for Business Leaders`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <AttributionTracker />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
