/**
 * PresenceToast Component
 * Individual toast notification for user join/leave events
 */

import React, { memo, useEffect, useState } from 'react';
import UserAvatar from './UserAvatar';
import { ARIA_LABELS } from '../../utils/accessibility';
import styles from './PresenceToast.module.css';

export type ToastType = 'join' | 'leave';

export interface ToastData {
  id: string;
  type: ToastType;
  userId: string;
  username: string;
  timestamp: number;
}

export interface PresenceToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
  duration?: number;
  className?: string;
}

const PresenceToast: React.FC<PresenceToastProps> = ({
  toast,
  onClose,
  duration = 3000,
  className = '',
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation before removing
    setTimeout(() => {
      onClose(toast.id);
    }, 200);
  };

  const getMessage = (): string => {
    return toast.type === 'join'
      ? `${toast.username} joined`
      : `${toast.username} left`;
  };

  const getIcon = (): string => {
    return toast.type === 'join' ? '👋' : '👋';
  };

  const ariaLabel =
    toast.type === 'join'
      ? ARIA_LABELS.userJoinedToast(toast.username)
      : ARIA_LABELS.userLeftToast(toast.username);

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]} ${isExiting ? styles.exiting : ''} ${className}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <div className={styles.content}>
        <UserAvatar
          userId={toast.userId}
          username={toast.username}
          size="small"
          showTooltip={false}
        />
        <div className={styles.message}>
          <span className={styles.icon} aria-hidden="true">
            {getIcon()}
          </span>
          <span className={styles.text}>{getMessage()}</span>
        </div>
      </div>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label={ARIA_LABELS.closeToast}
        type="button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default memo(PresenceToast);
