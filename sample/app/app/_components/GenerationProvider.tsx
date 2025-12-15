'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type Phase = 'idle' | 'fetching' | 'chaptering' | 'writing' | 'assembling' | 'done' | 'error';

type GenerationState = {
  inProgress: boolean;
  phase: Phase;
  videoUrl: string;
  startedAt: number | null;
  filename: string | null;
  markdown: string | null;
  error: string | null;
};

type GenerationContextValue = {
  state: GenerationState;
  start: (params: { videoUrl: string }) => void;
  clearResult: () => void;
};

const GenerationContext = createContext<GenerationContextValue | null>(null);

const STORAGE_KEY = 'aa_generation_state_v1';

function safeParse(json: string | null): any {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function playDoneSound() {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    gain.connect(ctx.destination);

    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(880, now);
    o1.connect(gain);
    o1.start(now);
    o1.stop(now + 0.18);

    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(1174.66, now + 0.18);
    o2.connect(gain);
    o2.start(now + 0.18);
    o2.stop(now + 0.35);

    // Cleanup
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 700);
  } catch {
    // ignore
  }
}

export function GenerationProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<GenerationState>(() => ({
    inProgress: false,
    phase: 'idle',
    videoUrl: '',
    startedAt: null,
    filename: null,
    markdown: null,
    error: null,
  }));

  const runningRef = useRef(false);
  const phaseTimersRef = useRef<number[]>([]);

  // Restore persisted state on mount
  useEffect(() => {
    const restored = safeParse(sessionStorage.getItem(STORAGE_KEY));
    if (!restored) return;

    // Only restore non-sensitive UI hints (not the markdown).
    if (restored?.inProgress) {
      setState((prev) => ({
        ...prev,
        inProgress: true,
        phase: restored.phase || 'fetching',
        videoUrl: restored.videoUrl || '',
        startedAt: typeof restored.startedAt === 'number' ? restored.startedAt : Date.now(),
      }));
    }
  }, []);

  // Persist minimal state
  useEffect(() => {
    const minimal = {
      inProgress: state.inProgress,
      phase: state.phase,
      videoUrl: state.videoUrl,
      startedAt: state.startedAt,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
  }, [state.inProgress, state.phase, state.videoUrl, state.startedAt]);

  // Block tab close / reload while generating
  useEffect(() => {
    if (!state.inProgress) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        'An article is still generating. Leaving this page may waste tokens and lose progress.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state.inProgress]);

  const clearTimers = () => {
    for (const id of phaseTimersRef.current) window.clearTimeout(id);
    phaseTimersRef.current = [];
  };

  const clearResult = useCallback(() => {
    setState({
      inProgress: false,
      phase: 'idle',
      videoUrl: '',
      startedAt: null,
      filename: null,
      markdown: null,
      error: null,
    });
    runningRef.current = false;
    clearTimers();
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const start = useCallback(
    (params: { videoUrl: string }) => {
      const videoUrl = (params.videoUrl || '').trim();
      if (!videoUrl) return;
      if (runningRef.current) return; // prevent duplicates

      runningRef.current = true;
      clearTimers();

      const startedAt = Date.now();
      setState({
        inProgress: true,
        phase: 'fetching',
        videoUrl,
        startedAt,
        filename: null,
        markdown: null,
        error: null,
      });

      // Best-effort step progression (UI only)
      phaseTimersRef.current.push(
        window.setTimeout(() => setState((s) => (s.inProgress ? { ...s, phase: 'chaptering' } : s)), 1200),
        window.setTimeout(() => setState((s) => (s.inProgress ? { ...s, phase: 'writing' } : s)), 3500),
        window.setTimeout(() => setState((s) => (s.inProgress ? { ...s, phase: 'assembling' } : s)), 7000)
      );

      (async () => {
        const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        console.groupCollapsed(`[generate] start ${runId}`);
        console.log('videoUrl', videoUrl);
        try {
          console.log('POST /api/generate-blog payload', { youtubeUrl: videoUrl, lang: 'en' });
          const resp = await fetch('/api/generate-blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ youtubeUrl: videoUrl, lang: 'en' }),
          });

          console.log('response status', resp.status, resp.statusText);
          console.log('response headers', {
            'content-type': resp.headers.get('content-type'),
            'content-disposition': resp.headers.get('content-disposition'),
          });

          if (!resp.ok) {
            const json = await resp.json().catch(() => null);
            console.log('error json', json);
            throw new Error(json?.error || `Request failed (${resp.status})`);
          }

          const md = await resp.text();
          console.log('markdown bytes', md.length);
          const disposition = resp.headers.get('content-disposition') || '';
          const match = disposition.match(/filename="([^"]+)"/i);
          const name = match?.[1] || 'articlealchemist.md';
          console.log('filename', name);

          clearTimers();
          setState((s) => ({
            ...s,
            inProgress: false,
            phase: 'done',
            markdown: md,
            filename: name,
            error: null,
          }));
          runningRef.current = false;
          sessionStorage.removeItem(STORAGE_KEY);
          playDoneSound();
        } catch (e) {
          console.error('generation failed', e);
          clearTimers();
          setState((s) => ({
            ...s,
            inProgress: false,
            phase: 'error',
            error: e instanceof Error ? e.message : 'Unknown error',
          }));
          runningRef.current = false;
          sessionStorage.removeItem(STORAGE_KEY);
        } finally {
          console.groupEnd();
        }
      })();
    },
    []
  );

  const value = useMemo<GenerationContextValue>(
    () => ({ state, start, clearResult }),
    [state, start, clearResult]
  );

  return (
    <GenerationContext.Provider value={value}>
      {props.children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error('useGeneration must be used within GenerationProvider');
  return ctx;
}

