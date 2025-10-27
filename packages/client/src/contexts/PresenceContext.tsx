/**
 * Presence Context
 * Manages user presence state and provides Socket.IO integration
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { UserPresence, CursorPosition, ActivityStatus } from '@collab/shared';
import { socketService } from '../services/SocketService';
import { getUserColor, sortUsersByActivity } from '../utils/colorAssignment';
import { debounce } from '../utils/performance';
import { announceToScreenReader } from '../utils/accessibility';

interface PresenceContextValue {
  // State
  activeUsers: UserPresence[];
  cursorPositions: Map<string, CursorPosition>;
  typingUsers: Set<string>;
  currentUser: UserPresence | null;
  isConnected: boolean;

  // Actions
  updateCursor: (lineNumber: number, column?: number) => void;
  setTypingStatus: (isTyping: boolean, lineNumber?: number) => void;
  getUserColor: (userId: string) => string;
  getUserByUserId: (userId: string) => UserPresence | undefined;
  getActiveUserCount: () => number;
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

interface PresenceProviderProps {
  children: ReactNode;
  roomId: string;
}

export const PresenceProvider: React.FC<PresenceProviderProps> = ({ children, roomId }) => {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [cursorPositions, setCursorPositions] = useState<Map<string, CursorPosition>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<UserPresence | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs for debounced functions
  const debouncedCursorUpdate = useRef<((lineNumber: number, column?: number) => void) | null>(
    null
  );
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize current user from socket service
   */
  useEffect(() => {
    const userInfo = socketService.getUserInfo();
    const socket = socketService.getSocket();

    if (socket && userInfo) {
      const user: UserPresence = {
        userId: userInfo.userId,
        username: userInfo.username,
        isActive: true,
        lastSeen: new Date(),
        color: getUserColor(userInfo.userId),
        status: 'active' as ActivityStatus,
        socketId: socket.id,
      };
      setCurrentUser(user);
    }
  }, []);

  /**
   * Handle user joined event
   */
  const handleUserJoined = useCallback(
    (data: UserPresence) => {
      console.log('👋 User joined (context):', data);

      setActiveUsers(prev => {
        // Check if user already exists
        if (prev.some(u => u.userId === data.userId)) {
          return prev;
        }

        const newUsers = [...prev, data];
        return sortUsersByActivity(newUsers);
      });

      // Announce to screen readers
      announceToScreenReader(`${data.username} joined the room`, 'polite');
    },
    []
  );

  /**
   * Handle user left event
   */
  const handleUserLeft = useCallback((data: { userId: string }) => {
    console.log('👋 User left (context):', data);

    setActiveUsers(prev => {
      const user = prev.find(u => u.userId === data.userId);
      const newUsers = prev.filter(u => u.userId !== data.userId);

      // Announce to screen readers
      if (user) {
        announceToScreenReader(`${user.username} left the room`, 'polite');
      }

      return newUsers;
    });

    // Remove cursor position
    setCursorPositions(prev => {
      const newMap = new Map(prev);
      newMap.delete(data.userId);
      return newMap;
    });

    // Remove from typing users
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(data.userId);
      return newSet;
    });
  }, []);

  /**
   * Handle cursor moved event
   */
  const handleCursorMoved = useCallback((data: CursorPosition) => {
    setCursorPositions(prev => {
      const newMap = new Map(prev);
      newMap.set(data.userId, data);
      return newMap;
    });

    // Update user's last seen time
    setActiveUsers(prev =>
      prev.map(user =>
        user.userId === data.userId
          ? { ...user, lastSeen: new Date(), currentLine: data.lineNumber }
          : user
      )
    );
  }, []);

  /**
   * Handle room joined event (initial user list)
   */
  const handleRoomJoined = useCallback(
    (data: { roomId: string; users: UserPresence[] }) => {
      console.log('🏠 Room joined (context):', data);

      // Filter out current user from active users list
      const userInfo = socketService.getUserInfo();
      const otherUsers = data.users.filter(u => u.userId !== userInfo.userId);

      setActiveUsers(sortUsersByActivity(otherUsers));
      setIsConnected(true);

      // Announce to screen readers
      const userCount = data.users.length;
      announceToScreenReader(
        `Connected to room with ${userCount} ${userCount === 1 ? 'user' : 'users'}`,
        'polite'
      );
    },
    []
  );

  /**
   * Handle status changed event
   */
  const handleStatusChanged = useCallback(
    (data: { userId: string; status: ActivityStatus }) => {
      setActiveUsers(prev =>
        prev.map(user =>
          user.userId === data.userId
            ? { ...user, status: data.status, isActive: data.status === 'active' }
            : user
        )
      );
    },
    []
  );

  /**
   * Handle room update event (bulk user update)
   */
  const handleRoomUpdate = useCallback((data: { activeUsers: UserPresence[] }) => {
    const userInfo = socketService.getUserInfo();
    const otherUsers = data.activeUsers.filter(u => u.userId !== userInfo.userId);
    setActiveUsers(sortUsersByActivity(otherUsers));
  }, []);

  /**
   * Setup Socket.IO event listeners
   */
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) {
      console.warn('Socket not available in PresenceProvider');
      return;
    }

    // Register event listeners
    socket.on('presence:user-joined', handleUserJoined);
    socket.on('presence:user-left', handleUserLeft);
    socket.on('presence:cursor-moved', handleCursorMoved);
    socket.on('room:joined', handleRoomJoined);
    socket.on('presence:status-changed', handleStatusChanged);
    socket.on('presence:room-update', handleRoomUpdate);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      socket.off('presence:user-joined', handleUserJoined);
      socket.off('presence:user-left', handleUserLeft);
      socket.off('presence:cursor-moved', handleCursorMoved);
      socket.off('room:joined', handleRoomJoined);
      socket.off('presence:status-changed', handleStatusChanged);
      socket.off('presence:room-update', handleRoomUpdate);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [
    handleUserJoined,
    handleUserLeft,
    handleCursorMoved,
    handleRoomJoined,
    handleStatusChanged,
    handleRoomUpdate,
  ]);

  /**
   * Setup heartbeat to keep presence alive
   */
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !isConnected) {
      return;
    }

    // Send heartbeat every 30 seconds
    const sendHeartbeat = () => {
      socket.emit('presence:heartbeat', {
        roomId,
        timestamp: Date.now(),
      });
    };

    // Initial heartbeat
    sendHeartbeat();

    // Regular heartbeats
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [roomId, isConnected]);

  /**
   * Create debounced cursor update function
   */
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) {
      return;
    }

    // Debounce cursor updates to reduce network traffic (150ms)
    debouncedCursorUpdate.current = debounce((lineNumber: number, column?: number) => {
      socket.emit('presence:update-cursor', {
        roomId,
        lineNumber,
        column,
      });
    }, 150);

    return () => {
      debouncedCursorUpdate.current = null;
    };
  }, [roomId]);

  /**
   * Update cursor position (debounced)
   */
  const updateCursor = useCallback(
    (lineNumber: number, column?: number) => {
      if (debouncedCursorUpdate.current) {
        debouncedCursorUpdate.current(lineNumber, column);
      }

      // Update current user's line immediately
      if (currentUser) {
        setCurrentUser(prev =>
          prev ? { ...prev, currentLine: lineNumber, lastSeen: new Date() } : null
        );
      }
    },
    [currentUser]
  );

  /**
   * Set typing status
   * Automatically clears typing status after 2 seconds of inactivity
   */
  const setTypingStatus = useCallback(
    (isTyping: boolean, lineNumber?: number) => {
      const userInfo = socketService.getUserInfo();

      if (isTyping) {
        setTypingUsers(prev => new Set(prev).add(userInfo.userId));

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Auto-clear after 2 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userInfo.userId);
            return newSet;
          });
        }, 2000);
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userInfo.userId);
          return newSet;
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    },
    []
  );

  /**
   * Get user by userId
   */
  const getUserByUserId = useCallback(
    (userId: string): UserPresence | undefined => {
      return activeUsers.find(u => u.userId === userId);
    },
    [activeUsers]
  );

  /**
   * Get active user count (including current user)
   */
  const getActiveUserCount = useCallback(() => {
    return activeUsers.length + (currentUser ? 1 : 0);
  }, [activeUsers, currentUser]);

  /**
   * Memoized context value
   */
  const contextValue = useMemo<PresenceContextValue>(
    () => ({
      activeUsers,
      cursorPositions,
      typingUsers,
      currentUser,
      isConnected,
      updateCursor,
      setTypingStatus,
      getUserColor,
      getUserByUserId,
      getActiveUserCount,
    }),
    [
      activeUsers,
      cursorPositions,
      typingUsers,
      currentUser,
      isConnected,
      updateCursor,
      setTypingStatus,
      getUserByUserId,
      getActiveUserCount,
    ]
  );

  return <PresenceContext.Provider value={contextValue}>{children}</PresenceContext.Provider>;
};

/**
 * Custom hook to use presence context
 */
export const usePresence = (): PresenceContextValue => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
