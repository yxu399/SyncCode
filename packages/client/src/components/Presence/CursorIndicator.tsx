/**
 * CursorIndicator Component
 * Displays a remote user's cursor position with username label
 */

import React, { memo } from 'react';
import { CursorPosition } from '@collab/shared';
import { getUserColor } from '../../utils/colorAssignment';
import { ARIA_LABELS } from '../../utils/accessibility';
import styles from './CursorIndicator.module.css';

export interface CursorIndicatorProps {
  cursor: CursorPosition;
  username: string;
  position: {
    top: number;
    left: number;
  };
  className?: string;
}

const CursorIndicator: React.FC<CursorIndicatorProps> = ({
  cursor,
  username,
  position,
  className = '',
}) => {
  const color = getUserColor(cursor.userId);

  return (
    <div
      className={`${styles.cursorContainer} ${className}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      aria-label={ARIA_LABELS.cursorIndicator(username)}
      role="img"
    >
      {/* Cursor pointer */}
      <svg
        className={styles.cursorPointer}
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2 2L10 18L12 10L20 8L2 2Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Username label */}
      <div
        className={styles.label}
        style={{
          backgroundColor: color,
        }}
      >
        <span className={styles.labelText}>{username}</span>
      </div>
    </div>
  );
};

export default memo(CursorIndicator);
