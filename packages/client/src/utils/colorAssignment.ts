/**
 * Color Assignment Utilities
 * Generates consistent colors and initials for users
 */

import { UserPresence, ActivityStatus } from '@collab/shared';

// Predefined color palette for user avatars (WCAG AA compliant)
const USER_COLORS = [
  '#2563eb', // blue-600
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#ea580c', // orange-600
  '#0891b2', // cyan-600
  '#ca8a04', // yellow-600
  '#db2777', // pink-600
  '#65a30d', // lime-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#e11d48', // rose-600
] as const;

/**
 * Generates a consistent color for a user based on their userId
 * Uses a simple hash function to ensure the same user always gets the same color
 */
export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

/**
 * Generates initials from a username
 * Examples:
 * - "John Doe" -> "JD"
 * - "Alice" -> "AL"
 * - "User-abc123" -> "US"
 */
export function getUserInitials(username: string): string {
  if (!username || username.trim().length === 0) {
    return '??';
  }

  const trimmed = username.trim();
  const words = trimmed.split(/[\s-_]+/);

  if (words.length >= 2) {
    // Take first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
  } else {
    // Take first two letters of single word
    return trimmed.slice(0, 2).toUpperCase();
  }
}

/**
 * Gets the activity status description for screen readers
 */
export function getActivityStatusLabel(status: ActivityStatus): string {
  const labels: Record<ActivityStatus, string> = {
    active: 'Currently active',
    idle: 'Idle',
    away: 'Away',
  };

  return labels[status] || 'Unknown status';
}

/**
 * Gets the CSS class name for activity status
 */
export function getActivityStatusClass(status: ActivityStatus): string {
  return `status-${status}`;
}

/**
 * Determines if a user is currently typing based on their last activity
 * @param lastSeen - Date when user was last seen
 * @param threshold - Time in milliseconds to consider user as typing (default 3000ms)
 */
export function isUserTyping(lastSeen: Date, threshold: number = 3000): boolean {
  const now = Date.now();
  const lastSeenTime = new Date(lastSeen).getTime();
  return now - lastSeenTime < threshold;
}

/**
 * Formats a user's last seen time for display
 */
export function formatLastSeen(lastSeen: Date): string {
  const now = Date.now();
  const lastSeenTime = new Date(lastSeen).getTime();
  const diffMs = now - lastSeenTime;

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) {
    return 'just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else {
    return `${diffHours}h ago`;
  }
}

/**
 * Sorts users by activity status and last seen
 * Active users first, then sorted by most recent activity
 */
export function sortUsersByActivity(users: UserPresence[]): UserPresence[] {
  return [...users].sort((a, b) => {
    // Active users first
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;

    // Then by status (active > idle > away)
    const statusOrder: Record<ActivityStatus, number> = {
      active: 0,
      idle: 1,
      away: 2,
    };

    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Finally by most recent last seen
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });
}
