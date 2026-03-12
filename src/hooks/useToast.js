/**
 * useToast hook
 * Self-contained toast state management – no global context needed.
 *
 * Usage:
 *   const { toasts, toast, dismissToast } = useToast();
 *   toast.success('Table added!');
 *   toast.error('Something went wrong');
 *   <ToastContainer toasts={toasts} onDismiss={dismissToast} />
 */

import { useState, useCallback, useRef } from 'react';

let _counter = 0;
const nextId = () => `toast-${++_counter}`;

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const setRef = useRef(setToasts);
  setRef.current = setToasts;

  const add = useCallback((type, message, duration = 4000) => {
    const id = nextId();
    setRef.current((prev) => [...prev, { id, type, message, duration }]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setRef.current((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => add('success', msg, duration),
    error:   (msg, duration) => add('error',   msg, duration),
    warning: (msg, duration) => add('warning', msg, duration),
    info:    (msg, duration) => add('info',    msg, duration),
  };

  return { toasts, toast, dismissToast };
};

export default useToast;
