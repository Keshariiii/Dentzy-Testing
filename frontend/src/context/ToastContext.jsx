import React, { createContext, useContext, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
// import '../styles/toast.css'; // Removed old custom styles

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const sonnerType = ['error', 'success', 'warning', 'info'].includes(type) ? type : 'info';
    return toast[sonnerType](message, { duration });
  }, []);

  const removeToast = useCallback((id) => {
    toast.dismiss(id);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <Toaster 
        position="top-center" 
        richColors 
        closeButton 
        theme="light" 
        expand={false}
        className="dz-sonner-toaster"
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
