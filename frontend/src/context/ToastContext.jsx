/**
 * ToastContext — Lightweight, responsive toast notification system.
 *
 * Usage:
 *   import { useToast } from '../context/ToastContext';
 *   const { showToast } = useToast();
 *   showToast('Something went wrong', 'error');
 *   showToast('Saved successfully', 'success');
 */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* ── Toast Container ── */}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '400px',
          width: '90vw',
          pointerEvents: 'none',
        }}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              style={{
                pointerEvents: 'auto',
                padding: '12px 18px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 600,
                lineHeight: 1.4,
                cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                animation: 'toast-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                ...(toast.type === 'error' ? {
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fca5a5',
                } : toast.type === 'success' ? {
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #86efac',
                } : toast.type === 'warning' ? {
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fcd34d',
                } : {
                  background: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #e2e8f0',
                }),
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes toast-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
