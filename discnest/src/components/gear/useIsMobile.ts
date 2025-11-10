'use client';

import { useEffect, useState } from 'react';

/** Simple responsive breakpoint hook (default 768px) */
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    onResize(); // initial check
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}
