import { useEffect, useRef, useState, useCallback } from 'react';

const IDLE_MS = 30 * 60 * 1000; // 30 minutos
const WARN_COUNTDOWN = 60; // segundos

export function useIdleTimer(onTimeout: () => void) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARN_COUNTDOWN);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningRef = useRef(false);

  const clearIdleTimer = () => {
    if (idleRef.current) clearTimeout(idleRef.current);
  };

  const clearCountdown = () => {
    if (countRef.current) clearInterval(countRef.current);
  };

  const startCountdown = useCallback(() => {
    clearCountdown();
    setCountdown(WARN_COUNTDOWN);
    countRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countRef.current!);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onTimeout]);

  const resetIdleTimer = useCallback(() => {
    if (warningRef.current) return;
    clearIdleTimer();
    idleRef.current = setTimeout(() => {
      warningRef.current = true;
      setShowWarning(true);
      startCountdown();
    }, IDLE_MS);
  }, [startCountdown]);

  const continueSession = useCallback(() => {
    warningRef.current = false;
    setShowWarning(false);
    clearCountdown();
    setCountdown(WARN_COUNTDOWN);
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      clearIdleTimer();
      clearCountdown();
    };
  }, [resetIdleTimer]);

  return { showWarning, countdown, continueSession };
}
