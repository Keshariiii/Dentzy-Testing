import '../styles/tokens.css';
import '../styles/reset.css';
import '../styles/skeleton.css';
import '../index.css';
import '../global-animations.css';
import '../responsive.css';
import '../admin/AdminDashboard.css';
import '../admin/DentistDetailModal.css';
import '../components/DentistDashboard.css';
import '../views/mobile/MobileAdminDashboard.css';
import Providers from './Providers';

export const metadata = {
  metadataBase: new URL('https://dentzy-testing.pages.dev'),
  title: 'Dentzy - Dental Lab Solutions',
  description: 'Dentzy Clinical Lab Portal — Manage dental lab orders, track cases, and streamline your practice.',
  applicationName: 'Dentzy',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/dentzy-favicon-icon.png', type: 'image/png', sizes: '1024x1024' },
      { url: '/dentzy-icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Dentzy - Dental Lab Solutions',
    description: 'Dentzy Clinical Lab Portal — Manage dental lab orders, track cases, and streamline your practice.',
    url: 'https://dentzy-testing.pages.dev',
    siteName: 'Dentzy',
    images: [
      {
        url: '/dentzy-icon.png',
        width: 512,
        height: 512,
        alt: 'Dentzy Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Dentzy - Dental Lab Solutions',
    description: 'Dentzy Clinical Lab Portal — Manage dental lab orders, track cases, and streamline your practice.',
    images: ['/dentzy-icon.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Dentzy',
              alternateName: ['Dentzy Dental Lab Solutions', 'Dentzy Portal'],
              url: 'https://dentzy-testing.pages.dev',
            }),
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

