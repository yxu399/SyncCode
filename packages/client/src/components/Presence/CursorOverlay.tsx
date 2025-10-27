/**
 * CursorOverlay Component
 * Container for all remote cursor indicators
 */

import React, { memo, useMemo } from 'react';
import { CursorPosition } from '@collab/shared';
import { UserPresence } from '@collab/shared';
import CursorIndicator from './CursorIndicator';
import { ARIA_LABELS } from '../../utils/accessibility';
import styles from './CursorOverlay.module.css';

export interface CursorOverlayProps {
  cursorPositions: Map<string, CursorPosition>;
  users: UserPresence[];
  containerRef?: React.RefObject<HTMLElement>;
  lineHeight?: number;
  className?: string;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({
  cursorPositions,
  users,
  containerRef,
  lineHeight = 30,
  className = '',
}) => {
  /**
   * Calculate cursor positions relative to container
   */
  const calculatedPositions = useMemo(() => {
    const positions: Array<{
      cursor: CursorPosition;
      username: string;
      position: { top: number; left: number };
    }> = [];

    cursorPositions.forEach((cursor, userId) => {
      const user = users.find(u => u.userId === userId);
      if (!user) return;

      // Calculate position based on line number
      // In a real editor, this would be more sophisticated
      const top = cursor.lineNumber * lineHeight;
      const left = (cursor.column || 0) * 8; // Approximate character width

      positions.push({
        cursor,
        username: user.username,
        position: { top, left },
      });
    });

    return positions;
  }, [cursorPositions, users, lineHeight]);

  if (calculatedPositions.length === 0) {
    return null;
  }

  return (
    <div
      className={`${styles.overlay} ${className}`}
      aria-label={ARIA_LABELS.cursorOverlay}
      role="presentation"
    >
      {calculatedPositions.map(({ cursor, username, position }) => (
        <CursorIndicator
          key={cursor.userId}
          cursor={cursor}
          username={username}
          position={position}
        />
      ))}
    </div>
  );
};

export default memo(CursorOverlay);
