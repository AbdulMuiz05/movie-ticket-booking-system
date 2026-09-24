import { useEffect, useMemo, useState } from 'react';

export const useCountdown = (target) => {
  const targetTime = useMemo(() => {
    if (!target) return 0;
    return new Date(target).getTime();
  }, [target]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetTime) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  const diffMs = Math.max(0, targetTime - now);
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: targetTime > 0 && diffMs <= 0,
    diffMs,
    totalSeconds,
    minutes,
    seconds,
    label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
};