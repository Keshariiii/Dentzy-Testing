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
  title: 'Dentzy - Dental Lab Solutions',
  description: 'Dentzy Clinical Lab Portal — Manage dental lab orders, track cases, and streamline your practice.',
  icons: {
    icon: '/dentzy-favicon-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
