/**
 * UserListItem Component
 * Single user item in the active users list
 */

import React, { memo } from 'react';
import { UserPresence } from '@collab/shared';
import UserAvatar from './UserAvatar';
import ActivityBadge from './ActivityBadge';
import { formatLastSeen } from '../../utils/colorAssignment';
import { ARIA_LABELS } from '../../utils/accessibility';
import styles from './UserListItem.module.css';

export interface UserListItemProps {
  user: UserPresence;
  isCurrentUser?: boolean;
  onClick?: (user: UserPresence) => void;
  className?: string;
}

const UserListItem: React.FC<UserListItemProps> = ({
  user,
  isCurrentUser = false,
  onClick,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(user);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(user);
    }
  };

  return (
    <div
      className={`${styles.listItem} ${isCurrentUser ? styles.currentUser : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : 'listitem'}
      tabIndex={onClick ? 0 : -1}
      aria-label={ARIA_LABELS.userListItem(user.username)}
    >
      <div className={styles.avatarContainer}>
        <UserAvatar
          userId={user.userId}
          username={user.username}
          size="medium"
          showTooltip={false}
        />
        <div className={styles.statusBadge}>
          <ActivityBadge status={user.status} size="small" />
        </div>
      </div>

      <div className={styles.userInfo}>
        <div className={styles.username}>
          {user.username}
          {isCurrentUser && <span className={styles.youBadge}>(you)</span>}
        </div>
        <div className={styles.metadata}>
          {user.currentLine !== undefined && (
            <span className={styles.currentLine}>Line {user.currentLine}</span>
          )}
          <span className={styles.lastSeen}>{formatLastSeen(user.lastSeen)}</span>
        </div>
      </div>
    </div>
  );
};

export default memo(UserListItem);
