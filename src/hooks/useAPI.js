/**
 * Custom Hook for API Calls with Loading and Error States
 * Premium implementation with caching and retry logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useAPI Hook - Handles API calls with loading, error, and data states
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export const useAPI = (apiFunction, options = {}) => {
  const {
    immediate = false,
    onSuccess,
    onError,
    cacheTime = 0,
    retry = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const cache = useRef(new Map());
  const mounted = useRef(true);
  const retryCount = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const execute = useCallback(async (...args) => {
    // Generate cache key from arguments
    const cacheKey = cacheTime > 0 ? JSON.stringify(args) : null;
    
    // Check cache
    if (cacheKey && cache.current.has(cacheKey)) {
      const cached = cache.current.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data);
        return cached.data;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      
      if (!mounted.current) return;

      setData(result);
      setLoading(false);
      retryCount.current = 0;

      // Cache result
      if (cacheKey) {
        cache.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      if (onSuccess) onSuccess(result);
      return result;

    } catch (err) {
      if (!mounted.current) return;

      // Retry logic
      if (retryCount.current < retry) {
        retryCount.current++;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        // Retry by calling apiFunction directly
        return execute(...args);
      }

      setError(err.message || 'An error occurred');
      setLoading(false);
      retryCount.current = 0;

      if (onError) onError(err);
      throw err;
    }
  }, [apiFunction, cacheTime, retry, retryDelay, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    cache.current.clear();
    retryCount.current = 0;
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]); // Only run once on mount

  return { data, loading, error, execute, reset };
};

/**
 * useDebounce Hook - Debounces a value
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} - Debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useLocalStorage Hook - Syncs state with localStorage
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value
 * @returns {Array} - [storedValue, setValue]
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

/**
 * useOnClickOutside Hook - Detects clicks outside an element
 * @param {Object} ref - React ref object
 * @param {Function} handler - Handler function
 */
export const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

/**
 * useMediaQuery Hook - Responds to media queries
 * @param {string} query - Media query string
 * @returns {boolean} - Whether the query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

export default useAPI;
