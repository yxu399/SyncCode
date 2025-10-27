/**
 * PresenceSidebar Component
 * Main sidebar showing active users and typing indicators
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { usePresence } from '../../contexts/PresenceContext';
import ActiveUsersList from './ActiveUsersList';
import TypingIndicator from './TypingIndicator';
import { ARIA_LABELS, isShortcutPressed } from '../../utils/accessibility';
import styles from './PresenceSidebar.module.css';

export interface PresenceSidebarProps {
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

const PresenceSidebar: React.FC<PresenceSidebarProps> = ({
  defaultOpen = true,
  collapsible = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { activeUsers, currentUser, typingUsers, getActiveUserCount } = usePresence();

  // Get users who are currently typing
  const typingUsersList = activeUsers.filter(user => typingUsers.has(user.userId));

  const toggleSidebar = useCallback(() => {
    if (collapsible) {
      setIsOpen(prev => !prev);
    }
  }, [collapsible]);

  /**
   * Keyboard shortcut handler (Shift+P to toggle)
   */
  useEffect(() => {
    if (!collapsible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isShortcutPressed(event, 'toggleSidebar')) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [collapsible, toggleSidebar]);

  const userCount = getActiveUserCount();

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed} ${className}`}
        aria-label={ARIA_LABELS.presenceSidebar}
        role="complementary"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Active Users
            <span className={styles.count}>{userCount}</span>
          </h2>
          {collapsible && (
            <button
              className={styles.toggleButton}
              onClick={toggleSidebar}
              aria-label={ARIA_LABELS.closePresenceSidebar}
              title="Close sidebar (Shift+P)"
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Users List */}
        <div className={styles.listContainer}>
          <ActiveUsersList users={activeUsers} currentUser={currentUser} />
        </div>

        {/* Typing Indicator */}
        {typingUsersList.length > 0 && (
          <div className={styles.typingContainer}>
            <TypingIndicator typingUsers={typingUsersList} />
          </div>
        )}
      </aside>

      {/* Toggle Button (when collapsed) */}
      {collapsible && !isOpen && (
        <button
          className={styles.floatingToggle}
          onClick={toggleSidebar}
          aria-label={ARIA_LABELS.togglePresenceSidebar}
          title={`Show users (${userCount}) - Shift+P`}
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 12C12.2091 12 14 10.2091 14 8C14 5.79086 12.2091 4 10 4C7.79086 4 6 5.79086 6 8C6 10.2091 7.79086 12 10 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 16C4 14.9391 4.42143 13.9217 5.17157 13.1716C5.92172 12.4214 6.93913 12 8 12H12C13.0609 12 14.0783 12.4214 14.8284 13.1716C15.5786 13.9217 16 14.9391 16 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.floatingCount}>{userCount}</span>
        </button>
      )}
    </>
  );
};

export default memo(PresenceSidebar);
