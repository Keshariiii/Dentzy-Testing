'use client';
/**
 * OfflineQueueContext — Queues mutations when the device is offline
 * and automatically replays them when connectivity returns.
 *
 * Usage:
 *   import { useOfflineQueue } from '../context/OfflineQueueContext';
 *   const { enqueue, isOnline, pendingCount } = useOfflineQueue();
 *
 *   // Instead of calling fetch directly:
 *   enqueue({
 *     url: `${API_URL}/profile`,
 *     options: { method: 'PUT', body: JSON.stringify(data) },
 *     onSuccess: (resData) => updateUserState(resData.user),
 *     onError:   (err) => showToast(err.message, 'error'),
 *     label: 'Update Profile',
 *   });
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../api/client';

const OfflineQueueContext = createContext(null);

const STORAGE_KEY = 'dentzy_offline_queue';

export const OfflineQueueProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [queue, setQueue] = useState([]);
  const callbacksRef = useRef({});

  // Client hydration check
  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine !== false);
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setQueue(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  // Persist queue to localStorage on every change once mounted
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.map(({ url, options, label, id }) => ({ url, options, label, id }))));
    } catch {
      // ignore
    }
  }, [queue, mounted]);

  // Online/offline listeners
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Flush queue when we come back online
  const flushQueue = useCallback(async () => {
    if (queue.length === 0) return;

    const items = [...queue];
    setQueue([]);

    for (const item of items) {
      try {
        const data = await apiFetch(item.url, item.options);
        const cbs = callbacksRef.current[item.id];
        if (cbs?.onSuccess) cbs.onSuccess(data);
      } catch (err) {
        const cbs = callbacksRef.current[item.id];
        if (cbs?.onError) cbs.onError(err);
      } finally {
        delete callbacksRef.current[item.id];
      }
    }
  }, [queue]);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      flushQueue();
    }
  }, [isOnline, flushQueue, queue.length]);

  /**
   * Enqueue a mutation. If online, executes immediately.
   * If offline, queues it for later replay.
   */
  const enqueue = useCallback(async ({ url, options, onSuccess, onError, label = 'Action' }) => {
    if (isOnline) {
      // Execute immediately
      try {
        const data = await apiFetch(url, options);
        if (onSuccess) onSuccess(data);
        return data;
      } catch (err) {
        if (onError) onError(err);
        throw err;
      }
    }

    // Offline — queue it
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    callbacksRef.current[id] = { onSuccess, onError };
    setQueue((prev) => [...prev, { id, url, options, label }]);
    return { queued: true, id, label };
  }, [isOnline]);

  const pendingCount = queue.length;

  return (
    <OfflineQueueContext.Provider value={{ isOnline, enqueue, pendingCount }}>
      {children}

      {/* Offline banner — only display on client after mounting if truly offline */}
      {mounted && !isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99998,
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          color: '#78350f',
          textAlign: 'center',
          padding: '8px 16px',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          You are offline — actions will be queued and synced automatically
          {pendingCount > 0 && ` (${pendingCount} pending)`}
        </div>
      )}
    </OfflineQueueContext.Provider>
  );
};

export const useOfflineQueue = () => {
  const ctx = useContext(OfflineQueueContext);
  if (!ctx) throw new Error('useOfflineQueue must be used inside OfflineQueueProvider');
  return ctx;
};
