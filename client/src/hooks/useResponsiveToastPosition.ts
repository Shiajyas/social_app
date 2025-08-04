

import { useEffect, useState } from 'react';

type ToastPosition = 'top-center' | 'bottom-left';

export const useResponsiveToastPosition = (breakpoint = 1000): ToastPosition => {
  const [toastPosition, setToastPosition] = useState<ToastPosition>(
    window.innerWidth < breakpoint ? 'top-center' : 'bottom-left'
  );

  useEffect(() => {
    const handleResize = () => {
      const newPosition = window.innerWidth < breakpoint ? 'top-center' : 'bottom-left';
      setToastPosition((prev) => (prev !== newPosition ? newPosition : prev));
    };

    window.addEventListener('resize', handleResize);
    // Call once on mount
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return toastPosition;
};
