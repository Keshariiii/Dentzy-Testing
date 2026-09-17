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
import '../styles/toast.css';

const ToastContext = createContext(null);

let toastIdCounter = 0;

const TOAST_TYPE_CLASS = {
  error:   'dz-toast--error',
  success: 'dz-toast--success',
  warning: 'dz-toast--warning',
  info:    'dz-toast--info',
};

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
        <div className="dz-toast-container">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              className={`dz-toast ${TOAST_TYPE_CLASS[toast.type] || TOAST_TYPE_CLASS.info}`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
