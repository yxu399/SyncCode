/**
 * TypingIndicator Component
 * Displays users who are currently typing
 */

import React, { memo } from 'react';
import { UserPresence } from '@collab/shared';
import { ARIA_LABELS } from '../../utils/accessibility';
import styles from './TypingIndicator.module.css';

export interface TypingIndicatorProps {
  typingUsers: UserPresence[];
  maxDisplay?: number;
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  maxDisplay = 3,
  className = '',
}) => {
  if (typingUsers.length === 0) {
    return null;
  }

  const displayUsers = typingUsers.slice(0, maxDisplay);
  const remainingCount = typingUsers.length - displayUsers.length;

  const getTypingText = (): string => {
    if (typingUsers.length === 1) {
      return `${displayUsers[0].username} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${displayUsers[0].username} and ${displayUsers[1].username} are typing...`;
    } else if (remainingCount > 0) {
      const names = displayUsers.map(u => u.username).join(', ');
      return `${names} and ${remainingCount} ${remainingCount === 1 ? 'other' : 'others'} are typing...`;
    } else {
      const names = displayUsers.slice(0, -1).map(u => u.username).join(', ');
      const lastName = displayUsers[displayUsers.length - 1].username;
      return `${names} and ${lastName} are typing...`;
    }
  };

  return (
    <div
      className={`${styles.typingIndicator} ${className}`}
      aria-label={ARIA_LABELS.typingIndicator}
      role="status"
      aria-live="polite"
    >
      <div className={styles.dots} aria-hidden="true">
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
      <span className={styles.text}>{getTypingText()}</span>
    </div>
  );
};

export default memo(TypingIndicator);
