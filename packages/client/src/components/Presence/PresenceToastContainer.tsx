/**
 * PresenceToastContainer Component
 * Manages and displays a queue of toast notifications
 */

import React, { memo, useCallback, useEffect, useState } from 'react';
import PresenceToast, { ToastData, ToastType } from './PresenceToast';
import { usePresence } from '../../contexts/PresenceContext';
import { ARIA_LABELS } from '../../utils/accessibility';
import styles from './PresenceToastContainer.module.css';

export interface PresenceToastContainerProps {
  maxToasts?: number;
  toastDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

const PresenceToastContainer: React.FC<PresenceToastContainerProps> = ({
  maxToasts = 3,
  toastDuration = 3000,
  position = 'bottom-right',
  className = '',
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const { activeUsers } = usePresence();
  const previousUsersRef = React.useRef<Set<string>>(new Set());

  /**
   * Track user join/leave events
   */
  useEffect(() => {
    const currentUserIds = new Set(activeUsers.map(u => u.userId));
    const previousUserIds = previousUsersRef.current;

    // Find new users (joined)
    currentUserIds.forEach(userId => {
      if (!previousUserIds.has(userId)) {
        const user = activeUsers.find(u => u.userId === userId);
        if (user) {
          addToast('join', user.userId, user.username);
        }
      }
    });

    // Find removed users (left)
    previousUserIds.forEach(userId => {
      if (!currentUserIds.has(userId)) {
        // We don't have the user object anymore, but we can use a cached username
        // For now, just show "User left"
        addToast('leave', userId, 'User');
      }
    });

    // Update previous users
    previousUsersRef.current = currentUserIds;
  }, [activeUsers]);

  /**
   * Add a new toast to the queue
   */
  const addToast = useCallback(
    (type: ToastType, userId: string, username: string) => {
      const newToast: ToastData = {
        id: `${type}-${userId}-${Date.now()}`,
        type,
        userId,
        username,
        timestamp: Date.now(),
      };

      setToasts(prev => {
        // Add new toast and limit to maxToasts
        const updated = [...prev, newToast];
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });
    },
    [maxToasts]
  );

  /**
   * Remove a toast from the queue
   */
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className={`${styles.container} ${styles[position]} ${className}`}
      aria-label={ARIA_LABELS.toastContainer}
      role="region"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <PresenceToast
          key={toast.id}
          toast={toast}
          onClose={removeToast}
          duration={toastDuration}
        />
      ))}
    </div>
  );
};

export default memo(PresenceToastContainer);
