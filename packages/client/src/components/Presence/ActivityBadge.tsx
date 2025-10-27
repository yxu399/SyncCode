/**
 * ActivityBadge Component
 * Displays activity status indicator (active/idle/away)
 */

import React, { memo } from 'react';
import { ActivityStatus } from '@collab/shared';
import { getActivityStatusLabel, getActivityStatusClass } from '../../utils/colorAssignment';
import styles from './ActivityBadge.module.css';

export interface ActivityBadgeProps {
  status: ActivityStatus;
  size?: 'small' | 'medium';
  showLabel?: boolean;
  className?: string;
}

const ActivityBadge: React.FC<ActivityBadgeProps> = ({
  status,
  size = 'small',
  showLabel = false,
  className = '',
}) => {
  const statusLabel = getActivityStatusLabel(status);
  const statusClass = getActivityStatusClass(status);

  return (
    <div
      className={`${styles.badge} ${styles[size]} ${styles[statusClass]} ${className}`}
      aria-label={statusLabel}
      role="status"
      title={statusLabel}
    >
      <span className={styles.indicator} aria-hidden="true" />
      {showLabel && <span className={styles.label}>{status}</span>}
    </div>
  );
};

export default memo(ActivityBadge);
