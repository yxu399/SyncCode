/**
 * Presence Optimization Hooks
 * Performance optimization hooks for presence features
 */

import { useMemo, useCallback, useRef } from 'react';
import { CursorPosition, UserPresence } from '@collab/shared';
import { debounce, throttle } from '../utils/performance';

/**
 * Optimized cursor update hook with debouncing
 * Reduces network traffic by debouncing cursor position updates
 *
 * @param updateFn - The function to call with cursor updates
 * @param delay - Debounce delay in milliseconds (default: 150ms)
 */
export function useOptimizedCursorUpdate(
  updateFn: (lineNumber: number, column?: number) => void,
  delay: number = 150
) {
  const debouncedUpdate = useRef(debounce(updateFn, delay));

  // Update the debounced function if updateFn changes
  const optimizedUpdate = useCallback(
    (lineNumber: number, column?: number) => {
      debouncedUpdate.current(lineNumber, column);
    },
    []
  );

  return optimizedUpdate;
}

/**
 * Memoized cursor positions hook
 * Prevents unnecessary re-renders when cursor positions haven't changed
 *
 * @param cursorPositions - Map of cursor positions
 * @param users - Array of user presence data
 */
export function useMemoizedCursors(
  cursorPositions: Map<string, CursorPosition>,
  users: UserPresence[]
) {
  return useMemo(() => {
    const cursors: Array<{
      userId: string;
      position: CursorPosition;
      username: string;
    }> = [];

    cursorPositions.forEach((position, userId) => {
      const user = users.find(u => u.userId === userId);
      if (user) {
        cursors.push({
          userId,
          position,
          username: user.username,
        });
      }
    });

    return cursors;
  }, [cursorPositions, users]);
}

/**
 * Throttled typing indicator hook
 * Limits how often typing status can be updated
 *
 * @param setTypingFn - Function to set typing status
 * @param interval - Throttle interval in milliseconds (default: 2000ms)
 */
export function useThrottledTypingUpdate(
  setTypingFn: (isTyping: boolean, lineNumber?: number) => void,
  interval: number = 2000
) {
  const throttledUpdate = useRef(throttle(setTypingFn, interval));

  const optimizedUpdate = useCallback(
    (isTyping: boolean, lineNumber?: number) => {
      throttledUpdate.current(isTyping, lineNumber);
    },
    []
  );

  return optimizedUpdate;
}

/**
 * Memoized active users list
 * Prevents re-rendering when user list hasn't changed
 *
 * @param users - Array of user presence data
 * @param filterFn - Optional filter function
 */
export function useMemoizedUsers<T extends UserPresence>(
  users: T[],
  filterFn?: (user: T) => boolean
) {
  return useMemo(() => {
    if (filterFn) {
      return users.filter(filterFn);
    }
    return users;
  }, [users, filterFn]);
}

/**
 * Presence visibility hook
 * Optimizes presence updates based on document visibility
 * Reduces updates when user is not viewing the document
 */
export function usePresenceVisibility(
  onVisibilityChange?: (isVisible: boolean) => void
) {
  const isVisible = useRef(true);

  const handleVisibilityChange = useCallback(() => {
    const visible = !document.hidden;
    if (isVisible.current !== visible) {
      isVisible.current = visible;
      onVisibilityChange?.(visible);
    }
  }, [onVisibilityChange]);

  // Setup visibility listener
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return {
    isVisible: isVisible.current,
    cleanup: () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    },
  };
}

/**
 * Batched presence updates hook
 * Batches multiple presence updates into a single operation
 *
 * @param updateFn - Function to call with batched updates
 * @param batchDelay - Delay before flushing batch (default: 100ms)
 */
export function useBatchedPresenceUpdates<T>(
  updateFn: (updates: T[]) => void,
  batchDelay: number = 100
) {
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addUpdate = useCallback(
    (update: T) => {
      batchRef.current.push(update);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (batchRef.current.length > 0) {
          updateFn([...batchRef.current]);
          batchRef.current = [];
        }
        timeoutRef.current = null;
      }, batchDelay);
    },
    [updateFn, batchDelay]
  );

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (batchRef.current.length > 0) {
      updateFn([...batchRef.current]);
      batchRef.current = [];
    }
  }, [updateFn]);

  return { addUpdate, flush };
}

/**
 * Presence connection status hook
 * Tracks connection state and provides reconnection logic
 */
export function usePresenceConnection(
  isConnected: boolean,
  onReconnect?: () => void
) {
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current++;
      onReconnect?.();
    }
  }, [onReconnect]);

  // Reset attempts on successful connection
  if (isConnected) {
    reconnectAttemptsRef.current = 0;
  }

  return {
    isConnected,
    reconnectAttempts: reconnectAttemptsRef.current,
    canReconnect: reconnectAttemptsRef.current < maxReconnectAttempts,
    handleReconnect,
  };
}
