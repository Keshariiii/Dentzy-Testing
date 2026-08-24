'use client';
/**
 * Providers — Client component that wraps the entire app with context providers.
 * Separated from layout.jsx because providers use React hooks (client-only).
 */
import { ToastProvider } from '../context/ToastContext';
import { AdminAuthProvider } from '../admin/AdminAuthContext';
import { AuthProvider } from '../context/AuthContext';
import { OfflineQueueProvider } from '../context/OfflineQueueContext';
import { useGlobalHaptics } from '../hooks/useGlobalHaptics';
import ScrollToTop from '../components/ScrollToTop';

export default function Providers({ children }) {
  useGlobalHaptics();

  return (
    <ToastProvider>
      <AdminAuthProvider>
        <AuthProvider>
          <OfflineQueueProvider>
            <div className="App">
              {children}
            </div>
            <ScrollToTop />
          </OfflineQueueProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </ToastProvider>
  );
}
