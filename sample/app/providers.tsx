'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import Lenis from 'lenis';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Smooth scrolling + better anchor navigation (Lenis).
    // Respect reduced-motion.
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      lerp: 0.1,
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}



