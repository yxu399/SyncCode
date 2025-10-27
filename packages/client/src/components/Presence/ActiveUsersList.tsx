/**
 * ActiveUsersList Component
 * Scrollable list of all active users in the room
 */

import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { UserPresence } from '@collab/shared';
import UserListItem from './UserListItem';
import { ARIA_LABELS } from '../../utils/accessibility';
import { handleListNavigation } from '../../utils/accessibility';
import styles from './ActiveUsersList.module.css';

export interface ActiveUsersListProps {
  users: UserPresence[];
  currentUser: UserPresence | null;
  onUserClick?: (user: UserPresence) => void;
  className?: string;
}

const ActiveUsersList: React.FC<ActiveUsersListProps> = ({
  users,
  currentUser,
  onUserClick,
  className = '',
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Combine current user with other users for display
  const allUsers = currentUser ? [currentUser, ...users] : users;

  // Update item refs array when user list changes
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, allUsers.length);
  }, [allUsers.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const handled = handleListNavigation(
        event.nativeEvent,
        focusedIndex,
        allUsers.length,
        newIndex => {
          setFocusedIndex(newIndex);
          itemRefs.current[newIndex]?.focus();
        }
      );

      if (!handled && event.key === 'Enter' && focusedIndex >= 0 && onUserClick) {
        event.preventDefault();
        onUserClick(allUsers[focusedIndex]);
      }
    },
    [focusedIndex, allUsers, onUserClick]
  );

  // Reset focus when list changes significantly
  useEffect(() => {
    if (focusedIndex >= allUsers.length) {
      setFocusedIndex(-1);
    }
  }, [allUsers.length, focusedIndex]);

  if (allUsers.length === 0) {
    return (
      <div className={`${styles.emptyState} ${className}`}>
        <p className={styles.emptyStateText}>No users in room</p>
        <p className={styles.emptyStateSubtext}>Waiting for others to join...</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className={`${styles.usersList} ${className}`}
      role="list"
      aria-label={ARIA_LABELS.activeUsersList}
      onKeyDown={handleKeyDown}
    >
      {allUsers.map((user, index) => {
        const isCurrentUser = currentUser ? user.userId === currentUser.userId : false;

        return (
          <div
            key={user.userId}
            ref={el => (itemRefs.current[index] = el)}
            role="listitem"
          >
            <UserListItem
              user={user}
              isCurrentUser={isCurrentUser}
              onClick={onUserClick}
            />
          </div>
        );
      })}

      <div className={styles.userCount}>
        {allUsers.length} {allUsers.length === 1 ? 'user' : 'users'} online
      </div>
    </div>
  );
};

export default memo(ActiveUsersList);
