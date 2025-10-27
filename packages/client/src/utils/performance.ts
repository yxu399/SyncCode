/**
 * Performance Optimization Utilities
 * Debounce and throttle functions for optimizing event handlers
 */

/**
 * Debounces a function call, ensuring it's only called after the specified delay
 * has passed since the last invocation
 *
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   searchAPI(query);
 * }, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttles a function call, ensuring it's only called at most once per interval
 *
 * @param func - The function to throttle
 * @param interval - The minimum interval between calls in milliseconds
 * @returns A throttled version of the function
 *
 * @example
 * const throttledScroll = throttle((event: Event) => {
 *   updateScrollPosition(event);
 * }, 100);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(...args: Parameters<T>): void {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    const executeFunction = () => {
      lastCallTime = Date.now();
      func(...args);
    };

    if (timeSinceLastCall >= interval) {
      // Enough time has passed, execute immediately
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      executeFunction();
    } else if (timeoutId === null) {
      // Schedule execution for later
      const remainingTime = interval - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        executeFunction();
      }, remainingTime);
    }
  };
}

/**
 * Creates a debounced version of a function with cleanup capability
 * Returns both the debounced function and a cancel function
 *
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns An object with the debounced function and a cancel function
 */
export function debouncedWithCancel<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const debounced = (...args: Parameters<T>): void => {
    cancel();
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };

  return { debounced, cancel };
}

/**
 * Request Animation Frame based throttle for smooth animations
 * Useful for scroll and resize handlers that update UI
 *
 * @param func - The function to throttle
 * @returns A throttled version of the function using RAF
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let latestArgs: Parameters<T> | null = null;

  return function throttled(...args: Parameters<T>): void {
    latestArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs !== null) {
          func(...latestArgs);
        }
        rafId = null;
        latestArgs = null;
      });
    }
  };
}

/**
 * Batch multiple updates into a single operation
 * Useful for reducing re-renders or API calls
 *
 * @param func - The function to execute with batched arguments
 * @param delay - The delay in milliseconds to wait for more arguments
 * @returns A function that accepts arguments to be batched
 */
export function batchUpdates<T>(
  func: (items: T[]) => void,
  delay: number = 50
): (item: T) => void {
  let items: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (item: T): void => {
    items.push(item);

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func([...items]);
      items = [];
      timeoutId = null;
    }, delay);
  };
}
