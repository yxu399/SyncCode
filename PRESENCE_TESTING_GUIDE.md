# User Presence System - Testing Guide

## Prerequisites

Before testing the User Presence System, ensure the following services are running:

1. **PostgreSQL** - Database (port 5433)
2. **Redis** - Caching and Pub/Sub (port 6379)
3. **Backend Server** - Node.js/Express/Socket.IO (port 5000)
4. **Frontend Client** - React application (port 3000)

## Quick Start

### 1. Start Infrastructure

```bash
cd /Users/xuy4/collaborative-editor/tools
docker-compose up -d

# Verify services are running
docker ps
# Should show: collab-editor-postgres, collab-editor-redis
```

### 2. Start Backend Server

```bash
cd /Users/xuy4/collaborative-editor/packages/server
yarn dev

# Expected output:
# ✅ Connected to server
# 🚀 Server running on port 5000
```

### 3. Start Frontend Client

```bash
cd /Users/xuy4/collaborative-editor/packages/client
yarn start

# Opens browser at http://localhost:3000
```

## Basic Testing Scenarios

### Scenario 1: Single User Experience

**Objective:** Verify UI works for a single user

**Steps:**
1. Navigate to `http://localhost:3000`
2. Enter room ID: "test-room"
3. Click "Join Room"

**Expected Results:**
- ✅ Presence sidebar visible on right
- ✅ User count shows "1 user online"
- ✅ Your username appears in the list with "(you)" badge
- ✅ Activity badge shows green (active)
- ✅ No toast notifications (no other users)
- ✅ No typing indicators
- ✅ Connection status shows "🟢 Connected"

### Scenario 2: Multi-User Collaboration

**Objective:** Test presence features with multiple users

**Steps:**
1. Open first browser tab: Join "test-room" as User-1
2. Open second browser tab: Join "test-room" as User-2
3. Open third browser tab (optional): Join "test-room" as User-3

**Expected Results in Each Tab:**

**Tab 1 (User-1):**
- ✅ Toast notification: "User-2 joined" (with avatar)
- ✅ User count updates to "2 users online"
- ✅ User-2 appears in sidebar with unique color
- ✅ If User-3 joins: Toast "User-3 joined", count = 3

**Tab 2 (User-2):**
- ✅ User-1 already visible in sidebar (joined first)
- ✅ User count shows "2 users online"
- ✅ If User-3 joins: Toast "User-3 joined", count = 3

**Tab 3 (User-3, if opened):**
- ✅ User-1 and User-2 already visible
- ✅ User count shows "3 users online"
- ✅ No join toast (already in room when joined)

### Scenario 3: Typing Indicators

**Objective:** Verify typing status synchronization

**Steps:**
1. Have 2+ tabs open in same room
2. In Tab 1, click in any line input field
3. Start typing text

**Expected Results:**

**Tab 1 (typing user):**
- ✅ Line highlights with light blue background
- ✅ Your activity status remains green

**Tab 2+ (other users):**
- ✅ Typing indicator appears at bottom of sidebar
- ✅ Shows "User-ABC is typing..." with animated dots
- ✅ User's activity badge shows green
- ✅ After 2 seconds of inactivity, typing indicator disappears

### Scenario 4: Cursor Position Tracking

**Objective:** Test cursor synchronization

**Steps:**
1. Have 2+ tabs open in same room
2. In Tab 1, click on line 0
3. Click on line 1
4. Click on line 2

**Expected Results:**

**Tab 1 (moving cursor):**
- ✅ Line highlights as you focus
- ✅ Current line updates in sidebar (📍 Line 0, 1, 2)

**Tab 2+ (other users):**
- ✅ User-1's current line shows in sidebar
- ✅ Line number updates as User-1 moves cursor
- ✅ Updates are smooth (debounced 150ms)

**Note:** Cursor indicators (floating cursors) require additional editor integration for proper display. Currently, cursor position is tracked but not rendered as floating cursors over the editor area.

### Scenario 5: User Leave

**Objective:** Test user departure handling

**Steps:**
1. Have 3 tabs open in "test-room"
2. In Tab 3, click "Leave Room" button

**Expected Results:**

**Tab 3 (leaving user):**
- ✅ Returns to room selection screen
- ✅ Presence state cleared

**Tab 1 & 2 (remaining users):**
- ✅ Toast notification: "User-XYZ left" (red border)
- ✅ User count decrements to "2 users online"
- ✅ User-XYZ removed from sidebar
- ✅ Toast auto-dismisses after 3 seconds

### Scenario 6: Sidebar Interactions

**Objective:** Test sidebar UI features

**Steps:**
1. Join any room
2. Look at the presence sidebar on the right

**Tests:**

**Collapse/Expand:**
- ✅ Click "X" button in sidebar header
- ✅ Sidebar slides out (to right)
- ✅ Floating blue button appears (top-right)
- ✅ Button shows user count badge
- ✅ Click floating button
- ✅ Sidebar slides back in

**Keyboard Shortcut:**
- ✅ Press `Shift+P` to toggle sidebar
- ✅ Works when sidebar open or closed
- ✅ Focus moves appropriately

**User List Scrolling:**
- ✅ If many users, list scrolls smoothly
- ✅ Custom scrollbar visible (thin, gray)
- ✅ User count footer stays at bottom

### Scenario 7: Toast Notifications

**Objective:** Test toast notification system

**Steps:**
1. Have Tab 1 open in "test-room"
2. Open Tab 2, join "test-room" → Toast "User joined"
3. Open Tab 3, join "test-room" → Toast "User joined"
4. Open Tab 4, join "test-room" → Toast "User joined"

**Expected Results:**
- ✅ Toasts appear in bottom-right corner
- ✅ Maximum 3 toasts visible at once
- ✅ Oldest toast removed when 4th appears
- ✅ Each toast has user avatar
- ✅ Green left border for join toasts
- ✅ Toast has close button (X)
- ✅ Clicking X closes toast immediately
- ✅ Toasts auto-dismiss after 3 seconds
- ✅ Smooth slide-in animation from right
- ✅ Smooth slide-out animation on dismiss

### Scenario 8: Activity Status

**Objective:** Test activity status indicators

**Steps:**
1. Join room, observe your activity badge (green)
2. Wait 30 seconds without interaction
3. Type something

**Expected Results:**
- ✅ Initially: Green pulsing dot (active)
- ✅ After idle time: Yellow static dot (idle)
- ✅ After longer idle: Gray static dot (away)
- ✅ On activity: Returns to green (active)
- ✅ Status syncs across all tabs

**Note:** Status transitions are managed by the backend. Frontend displays the status received via Socket.IO events.

### Scenario 9: Network Disconnection

**Objective:** Test behavior on connection loss

**Steps:**
1. Join room with multiple users
2. Open browser DevTools → Network tab
3. Enable "Offline" mode
4. Wait 5 seconds
5. Disable "Offline" mode

**Expected Results:**
- ✅ Connection status changes to "🔴 Disconnected"
- ✅ Sidebar remains visible (shows cached state)
- ✅ On reconnection: "🟢 Connected"
- ✅ Presence state refreshes automatically
- ✅ No duplicate users after reconnect

### Scenario 10: Accessibility Testing

**Objective:** Verify accessibility features

**Keyboard Navigation:**
1. Join room
2. Press `Tab` repeatedly
3. Navigate through UI elements

**Expected Results:**
- ✅ Focus indicator visible on all elements
- ✅ Can reach sidebar toggle button
- ✅ Can navigate user list with Tab
- ✅ Can close toasts with Tab + Enter
- ✅ Can reach "Leave Room" button

**Screen Reader (Optional):**
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Join room
3. Navigate UI with screen reader

**Expected Results:**
- ✅ Announces "Connected to room with X users"
- ✅ Announces "User-ABC joined the room"
- ✅ Announces "User-XYZ left the room"
- ✅ Reads user names in list
- ✅ Announces activity status

**Keyboard Shortcuts:**
- ✅ `Shift+P` toggles sidebar
- ✅ `Arrow Up/Down` navigates user list
- ✅ `Home` goes to first user
- ✅ `End` goes to last user
- ✅ `Escape` closes focused toast

## Performance Testing

### Test 1: Many Users

**Setup:** Simulate 10+ users in same room

**Method:**
1. Open 10 browser tabs
2. Join same room in each
3. Monitor performance

**Metrics to Check:**
- ✅ Sidebar renders all users quickly (<1s)
- ✅ Scrolling is smooth (60fps)
- ✅ No lag when typing
- ✅ Memory usage reasonable (<100MB per tab)
- ✅ Network traffic low (<1KB/s when idle)

### Test 2: Rapid Typing

**Setup:** Type quickly across multiple lines

**Method:**
1. Have 2 tabs open
2. In Tab 1, type rapidly on different lines
3. Observe Tab 2

**Metrics to Check:**
- ✅ Typing indicator appears/disappears correctly
- ✅ No lag or stuttering
- ✅ Cursor position updates smoothly
- ✅ Line number updates correctly
- ✅ No console errors

### Test 3: Toast Spam

**Setup:** Rapid join/leave events

**Method:**
1. Have Tab 1 open
2. Quickly open and close 10 tabs

**Metrics to Check:**
- ✅ Toast queue managed correctly (max 3 visible)
- ✅ No overlapping toasts
- ✅ Auto-dismiss works for all toasts
- ✅ No memory leaks
- ✅ Sidebar user count accurate

## Browser Compatibility Testing

Test on multiple browsers:

### Chrome
- ✅ All features work
- ✅ Animations smooth
- ✅ No console errors

### Firefox
- ✅ All features work
- ✅ CSS Grid/Flexbox correct
- ✅ Socket.IO connects

### Safari
- ✅ All features work
- ✅ WebSocket support
- ✅ Animations smooth

### Edge
- ✅ All features work
- ✅ Chromium-based features

## Mobile Responsive Testing

Test on mobile devices or DevTools device emulation:

### iPhone (375px width)
- ✅ Sidebar adapts (full width, max 320px)
- ✅ Toasts centered
- ✅ Touch targets large enough (48px min)
- ✅ Text readable (min 14px)
- ✅ Floating button accessible

### iPad (768px width)
- ✅ Sidebar correct width (300px)
- ✅ Layout adapts at breakpoint
- ✅ Touch-friendly buttons

### Android Phone (360px width)
- ✅ Same as iPhone tests
- ✅ Chrome mobile works

## Common Issues & Troubleshooting

### Issue: Users not appearing in sidebar

**Causes:**
- Backend server not running
- Socket.IO connection failed
- Room not joined successfully

**Debug:**
1. Check browser console for errors
2. Verify backend logs show "User joined"
3. Check Network tab for WebSocket connection
4. Verify `isConnected` shows "🟢 Connected"

### Issue: Typing indicator not showing

**Causes:**
- Typing status not being sent
- Socket event not received
- Debounce delay too long

**Debug:**
1. Check console for "presence:cursor-moved" events
2. Verify `setTypingStatus(true)` is called
3. Check backend emits typing events

### Issue: Toast notifications not appearing

**Causes:**
- PresenceToastContainer not rendered
- Z-index blocked by other elements
- Socket events not received

**Debug:**
1. Check PresenceToastContainer is in DOM
2. Verify z-index is 9999
3. Check console for "presence:user-joined" events
4. Verify toast creation in React DevTools

### Issue: Sidebar won't collapse

**Causes:**
- `collapsible` prop is false
- JavaScript error preventing state update
- CSS transition broken

**Debug:**
1. Check `collapsible` prop is true
2. Check console for errors
3. Verify `isOpen` state toggles in React DevTools
4. Check CSS transitions working

### Issue: Colors not consistent

**Causes:**
- Hash function not deterministic
- Color palette changed
- User ID not stable

**Debug:**
1. Verify `getUserColor(userId)` returns same color
2. Check userId is consistent across tabs
3. Verify color palette has 12 colors

## Testing Checklist

### Basic Functionality
- [ ] Single user can join room
- [ ] Multiple users can join same room
- [ ] User list updates on join/leave
- [ ] Typing indicators appear/disappear
- [ ] Toast notifications show on join/leave
- [ ] Sidebar can be collapsed/expanded
- [ ] Keyboard shortcut (Shift+P) works
- [ ] Connection status accurate

### UI/UX
- [ ] User avatars display correctly
- [ ] Colors are unique per user
- [ ] Activity badges show correct status
- [ ] Last seen time updates
- [ ] Current line indicator updates
- [ ] Animations are smooth
- [ ] Loading states visible
- [ ] Empty states display correctly

### Accessibility
- [ ] All elements keyboard accessible
- [ ] ARIA labels present
- [ ] Screen reader announcements work
- [ ] Focus indicators visible
- [ ] High contrast mode works
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion respected

### Performance
- [ ] No lag with 10+ users
- [ ] Smooth scrolling
- [ ] Efficient re-renders
- [ ] Low network traffic when idle
- [ ] No memory leaks
- [ ] Animations at 60fps

### Responsive Design
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1920px)
- [ ] Touch targets appropriate size
- [ ] Text readable on all sizes

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Automated Testing (Future)

For production, consider adding:

1. **Unit Tests** (Jest + React Testing Library)
   - Component rendering
   - Hook behavior
   - Utility functions

2. **Integration Tests** (Cypress/Playwright)
   - Multi-user scenarios
   - Socket.IO events
   - State management

3. **E2E Tests**
   - Full user flows
   - Real backend integration

4. **Visual Regression Tests** (Storybook + Chromatic)
   - Component appearance
   - Animation correctness

## Reporting Issues

When reporting issues, include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors/warnings
- Network tab screenshots (if relevant)
- React DevTools state (if relevant)

## Success Criteria

The User Presence System is working correctly when:

✅ All basic functionality tests pass
✅ All UI/UX elements render correctly
✅ All accessibility features work
✅ Performance is smooth with 10+ users
✅ Responsive design works on all devices
✅ No console errors or warnings
✅ All browsers supported

---

**Ready to test!** Start with Scenario 1 (Single User) and progress through each scenario. Report any issues found.
