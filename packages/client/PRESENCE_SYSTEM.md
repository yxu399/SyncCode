# User Presence System - Frontend Implementation

This document describes the frontend User Presence System implementation for the SyncCode collaborative editor.

## Overview

The User Presence System provides real-time visual feedback about other users in a collaborative editing session, including:

- **Active Users List**: Shows all users currently in the room
- **Cursor Indicators**: Displays where other users are editing
- **Typing Indicators**: Shows when users are actively typing
- **Join/Leave Notifications**: Toast notifications for user activity
- **Activity Status**: Visual indicators for user activity levels (active/idle/away)

## Architecture

### Component Hierarchy

```
PresenceProvider (Context)
├── PresenceSidebar
│   ├── ActiveUsersList
│   │   └── UserListItem
│   │       ├── UserAvatar
│   │       └── ActivityBadge
│   └── TypingIndicator
├── CursorOverlay
│   └── CursorIndicator
└── PresenceToastContainer
    └── PresenceToast
```

### Key Features

#### 1. State Management (React Context API)

The `PresenceContext` provides centralized state management for all presence-related data:

```typescript
interface PresenceContextValue {
  activeUsers: UserPresence[];
  cursorPositions: Map<string, CursorPosition>;
  typingUsers: Set<string>;
  currentUser: UserPresence | null;
  isConnected: boolean;
  updateCursor: (lineNumber: number, column?: number) => void;
  setTypingStatus: (isTyping: boolean, lineNumber?: number) => void;
  getUserColor: (userId: string) => string;
  getUserByUserId: (userId: string) => UserPresence | undefined;
  getActiveUserCount: () => number;
}
```

#### 2. Socket.IO Integration

The context automatically listens to Socket.IO events:

- `presence:user-joined` - New user enters room
- `presence:user-left` - User leaves room
- `presence:cursor-moved` - User moves cursor
- `room:joined` - Initial room connection with user list
- `presence:status-changed` - User activity status changes
- `presence:room-update` - Bulk user updates

#### 3. Performance Optimizations

**Debouncing:**
- Cursor updates debounced to 150ms
- Reduces network traffic for rapid cursor movements

**Throttling:**
- Typing indicators throttled to 2 seconds
- Prevents excessive status updates

**Memoization:**
- User lists memoized with `React.memo`
- Cursor positions cached to prevent re-renders
- Color assignments cached by userId

**Batching:**
- Multiple presence updates batched together
- Reduces re-renders and socket emissions

#### 4. Accessibility Features

**ARIA Labels:**
- All components have proper ARIA labels
- Screen reader announcements for join/leave events
- Live regions for dynamic content updates

**Keyboard Navigation:**
- Full keyboard support for user list
- Arrow keys for navigation
- Enter key for selection
- Escape key to close toasts
- Shift+P to toggle sidebar

**Visual Accessibility:**
- WCAG AA compliant color contrast
- High contrast mode support
- Focus indicators clearly visible
- Reduced motion support

## Component Details

### PresenceProvider

**Location:** `src/contexts/PresenceContext.tsx`

The central state management component that wraps the Editor.

**Usage:**
```tsx
<PresenceProvider roomId={roomId}>
  <EditorContent roomId={roomId} />
</PresenceProvider>
```

**Features:**
- Manages Socket.IO event listeners
- Maintains user list and cursor positions
- Handles heartbeat for presence detection
- Provides debounced cursor updates
- Announces user join/leave to screen readers

### PresenceSidebar

**Location:** `src/components/Presence/PresenceSidebar.tsx`

Main sidebar showing active users and typing indicators.

**Props:**
```typescript
interface PresenceSidebarProps {
  defaultOpen?: boolean;        // Default: true
  collapsible?: boolean;         // Default: true
  className?: string;
}
```

**Features:**
- Collapsible with floating toggle button
- Shows user count badge
- Displays typing indicators at bottom
- Keyboard shortcut (Shift+P) to toggle
- Responsive design for mobile

### ActiveUsersList

**Location:** `src/components/Presence/ActiveUsersList.tsx`

Scrollable list of all active users in the room.

**Features:**
- Auto-sorts users by activity
- Shows current user at top
- Displays line number for each user
- Last seen timestamp
- Empty state when no users
- Keyboard navigation support

### UserListItem

**Location:** `src/components/Presence/UserListItem.tsx`

Individual user entry in the active users list.

**Features:**
- User avatar with initials
- Activity status badge
- Username display
- Current line indicator
- Last seen time
- "(you)" badge for current user
- Hover and focus states

### UserAvatar

**Location:** `src/components/Presence/UserAvatar.tsx`

Displays user avatar with colored background and initials.

**Sizes:**
- `small`: 24px (for toasts, cursors)
- `medium`: 32px (for user list)
- `large`: 48px (for profiles)

**Features:**
- Consistent color per user (hash-based)
- Uppercase initials (2 characters)
- Tooltip with full username
- WCAG AA compliant colors

### ActivityBadge

**Location:** `src/components/Presence/ActivityBadge.tsx`

Shows user activity status with colored indicator.

**Status Types:**
- `active`: Green pulsing dot
- `idle`: Yellow static dot
- `away`: Gray static dot

**Features:**
- Animated pulse for active status
- Optional text label
- Screen reader friendly
- Reduced motion support

### CursorIndicator

**Location:** `src/components/Presence/CursorIndicator.tsx`

Displays a remote user's cursor position with username label.

**Features:**
- Custom SVG cursor pointer
- Color-coded by user
- Username label below cursor
- Smooth position transitions
- White border for visibility

### CursorOverlay

**Location:** `src/components/Presence/CursorOverlay.tsx`

Container that manages all cursor indicators.

**Features:**
- Absolute positioning over editor
- Calculates cursor positions from line numbers
- Non-interactive (pointer-events: none)
- Filters out current user's cursor

### TypingIndicator

**Location:** `src/components/Presence/TypingIndicator.tsx`

Shows users who are currently typing.

**Features:**
- Animated bouncing dots
- Shows up to 3 usernames
- "and X others" for additional users
- Auto-hides when no typing activity
- ARIA live region for screen readers

### PresenceToast

**Location:** `src/components/Presence/PresenceToast.tsx`

Individual toast notification for user join/leave events.

**Props:**
```typescript
interface PresenceToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
  duration?: number;            // Default: 3000ms
  className?: string;
}
```

**Features:**
- User avatar display
- Join/leave message with emoji
- Auto-dismiss after duration
- Manual close button
- Slide-in/out animations
- Color-coded border (green for join, red for leave)

### PresenceToastContainer

**Location:** `src/components/Presence/PresenceToastContainer.tsx`

Manages queue of toast notifications.

**Props:**
```typescript
interface PresenceToastContainerProps {
  maxToasts?: number;           // Default: 3
  toastDuration?: number;       // Default: 3000ms
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}
```

**Features:**
- Tracks user join/leave events
- Limits visible toasts to maxToasts
- Auto-positions based on prop
- Responsive mobile layout
- ARIA live region

## Utility Functions

### Color Assignment (`src/utils/colorAssignment.ts`)

- `getUserColor(userId)`: Generates consistent color per user
- `getUserInitials(username)`: Extracts 2-letter initials
- `getActivityStatusLabel(status)`: Screen reader label for status
- `isUserTyping(lastSeen, threshold)`: Determines if user is typing
- `formatLastSeen(lastSeen)`: Human-readable time (e.g., "2m ago")
- `sortUsersByActivity(users)`: Sorts by activity status

### Performance (`src/utils/performance.ts`)

- `debounce(func, delay)`: Debounces function calls
- `throttle(func, interval)`: Throttles function calls
- `debouncedWithCancel(func, delay)`: Debounce with cancel function
- `rafThrottle(func)`: RequestAnimationFrame-based throttle
- `batchUpdates(func, delay)`: Batches multiple updates

### Accessibility (`src/utils/accessibility.ts`)

- `ARIA_LABELS`: Centralized ARIA label constants
- `KEYBOARD_SHORTCUTS`: Keyboard shortcut definitions
- `isShortcutPressed(event, shortcut)`: Checks keyboard shortcuts
- `createFocusTrap(container)`: Focus management for modals
- `announceToScreenReader(message)`: Screen reader announcements
- `getContrastRatio(color1, color2)`: WCAG contrast checking
- `handleListNavigation(event, index, length)`: Arrow key navigation

## Custom Hooks

### usePresence (`src/hooks/usePresence.ts`)

Re-exports the `usePresence` hook from PresenceContext.

**Usage:**
```typescript
const {
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
} = usePresence();
```

### usePresenceOptimization (`src/hooks/usePresenceOptimization.ts`)

Performance optimization hooks:

- `useOptimizedCursorUpdate(updateFn, delay)`: Debounced cursor updates
- `useMemoizedCursors(cursorPositions, users)`: Memoized cursor list
- `useThrottledTypingUpdate(setTypingFn, interval)`: Throttled typing status
- `useMemoizedUsers(users, filterFn)`: Memoized user list
- `usePresenceVisibility(onVisibilityChange)`: Document visibility tracking
- `useBatchedPresenceUpdates(updateFn, batchDelay)`: Batched updates
- `usePresenceConnection(isConnected, onReconnect)`: Connection tracking

## Styling

All components use CSS Modules for isolated styling:

- **Naming Convention:** Component.module.css
- **Class Names:** camelCase (e.g., `.userAvatar`, `.typingIndicator`)
- **Responsive Design:** Mobile-first with breakpoint at 768px
- **Dark Mode:** `@media (prefers-color-scheme: dark)` support
- **Accessibility:** High contrast mode and reduced motion support
- **Animations:** Smooth transitions with CSS transitions and keyframes

### Color Palette

```css
/* Primary Colors (WCAG AA Compliant) */
--blue-600: #2563eb;
--red-600: #dc2626;
--green-600: #16a34a;
--yellow-600: #ca8a04;
--purple-600: #9333ea;
--orange-600: #ea580c;
--cyan-600: #0891b2;

/* Neutral Colors */
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-900: #1f2937;
```

## Integration

### Editor Integration

```tsx
import { PresenceProvider } from '../contexts/PresenceContext';
import PresenceSidebar from './Presence/PresenceSidebar';
import PresenceToastContainer from './Presence/PresenceToastContainer';
import { usePresence } from '../hooks/usePresence';

const EditorContent: React.FC<{ roomId: string }> = ({ roomId }) => {
  const { updateCursor, setTypingStatus } = usePresence();

  const handleLineChange = (lineNumber: number, content: string) => {
    // ... existing logic
    updateCursor(lineNumber, content.length);
    setTypingStatus(true, lineNumber);
  };

  const handleLineFocus = (lineNumber: number) => {
    updateCursor(lineNumber, lines[lineNumber]?.length || 0);
  };

  const handleLineBlur = () => {
    setTypingStatus(false);
  };

  return (
    <div>
      {/* Editor content */}
      <PresenceSidebar defaultOpen={true} collapsible={true} />
      <PresenceToastContainer position="bottom-right" maxToasts={3} />
    </div>
  );
};

const Editor: React.FC<EditorProps> = ({ roomId }) => {
  return (
    <PresenceProvider roomId={roomId}>
      <EditorContent roomId={roomId} />
    </PresenceProvider>
  );
};
```

## Testing

### Manual Testing Checklist

- [ ] Multiple users can join the same room
- [ ] User avatars appear in sidebar
- [ ] Activity status updates correctly
- [ ] Cursor positions sync across users
- [ ] Typing indicators appear/disappear correctly
- [ ] Toast notifications show on join/leave
- [ ] Sidebar can be collapsed/expanded
- [ ] Keyboard shortcuts work (Shift+P)
- [ ] Last seen time updates
- [ ] Current line indicator updates
- [ ] Colors are consistent per user
- [ ] Toasts auto-dismiss after 3 seconds
- [ ] Empty state shows when alone
- [ ] Heartbeat keeps presence alive
- [ ] Reconnection works after disconnect

### Accessibility Testing

- [ ] Screen reader announces user join/leave
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] High contrast mode works
- [ ] Reduced motion respected
- [ ] Color contrast meets WCAG AA

### Performance Testing

- [ ] Cursor updates don't lag with 10+ users
- [ ] No memory leaks after extended use
- [ ] Smooth animations at 60fps
- [ ] Network traffic reasonable (<1KB/s idle)
- [ ] No excessive re-renders

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

1. **Cursor Position Calculation**: Currently uses simple line number calculation. In a production editor, would need integration with actual editor cursor API.

2. **Virtual Scrolling**: User list doesn't use virtual scrolling yet. For rooms with 100+ users, this should be added.

3. **Presence Persistence**: Presence state is not persisted. On reconnection, users need to rejoin.

4. **Cursor Conflicts**: Multiple cursors at same position may overlap. Z-index stacking should be improved.

5. **Mobile Gestures**: Touch gestures for sidebar not fully optimized.

## Future Enhancements

1. **User Profiles**: Click on user to view profile/stats
2. **Follow Mode**: Option to follow another user's cursor
3. **Private Messages**: Direct messaging between users
4. **Cursor Trails**: Optional cursor trail animation
5. **Presence History**: Timeline of user activity
6. **Screen Sharing**: Share screen with collaborators
7. **Voice Chat**: Integrated voice communication
8. **Presence Analytics**: Track collaboration patterns

## Troubleshooting

### Users Not Appearing in Sidebar

- Check Socket.IO connection status
- Verify backend presence events are emitting
- Check browser console for errors
- Ensure PresenceProvider wraps Editor

### Cursor Positions Not Syncing

- Verify `updateCursor` called on input change
- Check debounce delay not too long
- Ensure Socket.IO room joined successfully

### Toast Notifications Not Showing

- Check PresenceToastContainer is rendered
- Verify user join/leave events received
- Check z-index not blocked by other elements

### Performance Issues

- Reduce number of active users for testing
- Check for memory leaks in DevTools
- Verify debouncing/throttling working
- Use React DevTools Profiler

## Resources

- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [React Context API](https://react.dev/reference/react/createContext)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Modules](https://github.com/css-modules/css-modules)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
