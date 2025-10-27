/**
 * UserAvatar Component
 * Displays user avatar with initials and color background
 */

import React, { memo } from 'react';
import { getUserInitials, getUserColor } from '../../utils/colorAssignment';
import { ARIA_LABELS } from '../../utils/accessibility';
import styles from './UserAvatar.module.css';

export interface UserAvatarProps {
  userId: string;
  username: string;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  username,
  size = 'medium',
  showTooltip = true,
  className = '',
}) => {
  const initials = getUserInitials(username);
  const color = getUserColor(userId);

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${className}`}
      style={{ backgroundColor: color }}
      title={showTooltip ? username : undefined}
      aria-label={ARIA_LABELS.userAvatar(username)}
      role="img"
    >
      <span className={styles.initials} aria-hidden="true">
        {initials}
      </span>
    </div>
  );
};

export default memo(UserAvatar);
