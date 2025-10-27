/**
 * Accessibility Utilities
 * ARIA labels, keyboard shortcuts, and accessibility helpers
 */

/**
 * ARIA labels for presence components
 */
export const ARIA_LABELS = {
  // Presence Sidebar
  presenceSidebar: 'Active users in room',
  closePresenceSidebar: 'Close presence sidebar',
  togglePresenceSidebar: 'Toggle presence sidebar',

  // User List
  activeUsersList: 'List of active users',
  userListItem: (username: string) => `User ${username}`,
  userAvatar: (username: string) => `${username}'s avatar`,
  userStatus: (username: string, status: string) => `${username} is ${status}`,

  // Cursor
  cursorIndicator: (username: string) => `${username}'s cursor position`,
  cursorOverlay: 'Remote user cursor positions',

  // Typing
  typingIndicator: 'Users currently typing',
  userTyping: (username: string) => `${username} is typing`,

  // Toast
  toastContainer: 'Presence notifications',
  userJoinedToast: (username: string) => `${username} joined the room`,
  userLeftToast: (username: string) => `${username} left the room`,
  closeToast: 'Dismiss notification',
} as const;

/**
 * Keyboard shortcuts for presence UI
 */
export const KEYBOARD_SHORTCUTS = {
  toggleSidebar: 'Shift+P',
  focusUserList: 'Shift+U',
  nextUser: 'ArrowDown',
  previousUser: 'ArrowUp',
  closeToast: 'Escape',
  dismissAll: 'Shift+Escape',
} as const;

/**
 * Keyboard event handlers
 */

/**
 * Checks if a keyboard event matches a specific shortcut key combination
 */
export function isShortcutPressed(
  event: KeyboardEvent,
  shortcut: keyof typeof KEYBOARD_SHORTCUTS
): boolean {
  const key = KEYBOARD_SHORTCUTS[shortcut];

  // Parse shortcut string (e.g., "Shift+P" or "Escape")
  const parts = key.split('+');
  const modifiers = parts.slice(0, -1);
  const mainKey = parts[parts.length - 1];

  // Check if main key matches
  if (event.key !== mainKey) {
    return false;
  }

  // Check modifiers
  for (const modifier of modifiers) {
    switch (modifier) {
      case 'Shift':
        if (!event.shiftKey) return false;
        break;
      case 'Ctrl':
      case 'Control':
        if (!event.ctrlKey) return false;
        break;
      case 'Alt':
        if (!event.altKey) return false;
        break;
      case 'Meta':
        if (!event.metaKey) return false;
        break;
      default:
        return false;
    }
  }

  // Check that no extra modifiers are pressed
  const expectedModifiers = modifiers.length;
  const actualModifiers =
    (event.shiftKey ? 1 : 0) +
    (event.ctrlKey ? 1 : 0) +
    (event.altKey ? 1 : 0) +
    (event.metaKey ? 1 : 0);

  return expectedModifiers === actualModifiers;
}

/**
 * Manages focus within a component (focus trap)
 */
export function createFocusTrap(containerElement: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  const focusableSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  let previousActiveElement: Element | null = null;

  const activate = () => {
    previousActiveElement = document.activeElement;

    const focusableElements = containerElement.querySelectorAll(focusableSelector);
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  };

  const deactivate = () => {
    if (previousActiveElement && previousActiveElement instanceof HTMLElement) {
      previousActiveElement.focus();
    }
  };

  return { activate, deactivate };
}

/**
 * Announces a message to screen readers using ARIA live regions
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Check if live region already exists
  let liveRegion = document.getElementById('presence-live-region');

  if (!liveRegion) {
    // Create live region if it doesn't exist
    liveRegion = document.createElement('div');
    liveRegion.id = 'presence-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  } else {
    // Update priority if needed
    liveRegion.setAttribute('aria-live', priority);
  }

  // Clear and set new message
  liveRegion.textContent = '';
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);
}

/**
 * Gets the contrast ratio between two colors
 * Useful for ensuring WCAG AA compliance (minimum 4.5:1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Remove # if present
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color has sufficient contrast with white text
 * (WCAG AA requires minimum 4.5:1 for normal text)
 */
export function hasGoodContrastWithWhite(backgroundColor: string): boolean {
  const ratio = getContrastRatio(backgroundColor, '#FFFFFF');
  return ratio >= 4.5;
}

/**
 * Gets appropriate text color (black or white) for a given background color
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return hasGoodContrastWithWhite(backgroundColor) ? '#FFFFFF' : '#000000';
}

/**
 * Focus management utilities
 */

/**
 * Manages focus for list navigation (arrow keys)
 */
export function handleListNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  listLength: number,
  onNavigate: (newIndex: number) => void
): boolean {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const newIndex = (currentIndex + 1) % listLength;
    onNavigate(newIndex);
    return true;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const newIndex = (currentIndex - 1 + listLength) % listLength;
    onNavigate(newIndex);
    return true;
  } else if (event.key === 'Home') {
    event.preventDefault();
    onNavigate(0);
    return true;
  } else if (event.key === 'End') {
    event.preventDefault();
    onNavigate(listLength - 1);
    return true;
  }

  return false;
}
