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
  articleId: string | null;
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
    articleId: null,
    videoUrl: '',
    startedAt: null,
    filename: null,
    markdown: null,
    error: null,
  }));

  const runningRef = useRef(false);
  const phaseTimersRef = useRef<number[]>([]);
  const pollRef = useRef<number | null>(null);

  const clearPoll = () => {
    if (pollRef.current) window.clearTimeout(pollRef.current);
    pollRef.current = null;
  };

  const mapProgressToPhase = (p: any): Phase => {
    const raw = (p?.phase || '').toString();
    if (raw === 'fetching') return 'fetching';
    if (raw === 'chaptering') return 'chaptering';
    if (raw === 'assembling' || raw === 'saving') return 'assembling';
    if (raw === 'writing_v1' || raw === 'feedback' || raw === 'writing_v2') return 'writing';
    return 'writing';
  };

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
        articleId: restored.articleId || null,
        videoUrl: restored.videoUrl || '',
        startedAt: typeof restored.startedAt === 'number' ? restored.startedAt : Date.now(),
      }));
    }
  }, []);

  // Always reconcile against server state on mount (survives refresh/close)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/generation/status', { cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as any;
        if (!mounted) return;
        if (!res.ok || !json) return;

        if (json.inProgress && json.article?.id) {
          const p = json.article.progress || null;
          const startedAtIso = (p?.startedAt || p?.updatedAt || '').toString();
          const startedAtMs = startedAtIso ? Date.parse(startedAtIso) : Date.now();
          setState((s) => ({
            ...s,
            inProgress: true,
            articleId: json.article.id,
            videoUrl: json.article.videoUrl || '',
            phase: mapProgressToPhase(p),
            startedAt: Number.isFinite(startedAtMs) ? startedAtMs : Date.now(),
            error: null,
          }));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist minimal state
  useEffect(() => {
    const minimal = {
      inProgress: state.inProgress,
      phase: state.phase,
      articleId: state.articleId,
      videoUrl: state.videoUrl,
      startedAt: state.startedAt,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
  }, [state.inProgress, state.phase, state.articleId, state.videoUrl, state.startedAt]);

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
      articleId: null,
      videoUrl: '',
      startedAt: null,
      filename: null,
      markdown: null,
      error: null,
    });
    runningRef.current = false;
    clearTimers();
    clearPoll();
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const pollOnce = useCallback(async () => {
    const articleId = state.articleId;
    if (!articleId) return;

    try {
      const res = await fetch(`/api/generation/status?articleId=${encodeURIComponent(articleId)}`, {
        cache: 'no-store',
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok || !json?.article) return;

      const p = json.article.progress || null;
      const nextPhase = mapProgressToPhase(p);
      const startedAtIso = (p?.startedAt || '').toString();
      const startedAtMs = startedAtIso ? Date.parse(startedAtIso) : null;

      if (json.article.status === 'draft') {
        setState((s) => ({
          ...s,
          inProgress: true,
          phase: nextPhase,
          videoUrl: json.article.videoUrl || s.videoUrl,
          startedAt:
            startedAtMs && Number.isFinite(startedAtMs) ? startedAtMs : s.startedAt || Date.now(),
        }));
        return;
      }

      if (json.article.status === 'complete') {
        const resp = await fetch(
          `/api/generation/result?articleId=${encodeURIComponent(articleId)}`,
          { cache: 'no-store' }
        );
        if (!resp.ok) throw new Error(`Result fetch failed (${resp.status})`);
        const md = await resp.text();
        const disposition = resp.headers.get('content-disposition') || '';
        const match = disposition.match(/filename="([^"]+)"/i);
        const name = match?.[1] || 'articlealchemist.md';

        clearTimers();
        clearPoll();
        setState((s) => ({
          ...s,
          inProgress: false,
          phase: 'done',
          filename: name,
          markdown: md,
          error: null,
        }));
        runningRef.current = false;
        sessionStorage.removeItem(STORAGE_KEY);
        playDoneSound();
        return;
      }

      if (json.article.status === 'failed') {
        clearTimers();
        clearPoll();
        setState((s) => ({
          ...s,
          inProgress: false,
          phase: 'error',
          error: (p?.message || 'Generation failed').toString(),
        }));
        runningRef.current = false;
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore transient polling errors
    }
  }, [state.articleId]);

  // Poll while in progress (keeps banner alive after refresh)
  useEffect(() => {
    if (!state.inProgress || !state.articleId) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await pollOnce();
      if (cancelled) return;
      pollRef.current = window.setTimeout(tick, 2500);
    };

    tick();
    return () => {
      cancelled = true;
      clearPoll();
    };
  }, [state.inProgress, state.articleId, pollOnce]);

  const start = useCallback(
    (params: { videoUrl: string }) => {
      const videoUrl = (params.videoUrl || '').trim();
      if (!videoUrl) return;
      if (runningRef.current) return; // prevent duplicates

      runningRef.current = true;
      clearTimers();
      clearPoll();

      const startedAt = Date.now();
      setState({
        inProgress: true,
        phase: 'fetching',
        articleId: null,
        videoUrl,
        startedAt,
        filename: null,
        markdown: null,
        error: null,
      });

      (async () => {
        const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        console.groupCollapsed(`[generate] start ${runId}`);
        console.log('videoUrl', videoUrl);
        try {
          console.log('POST /api/generation/start payload', { youtubeUrl: videoUrl, lang: 'en' });
          const resp = await fetch('/api/generation/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ youtubeUrl: videoUrl, lang: 'en' }),
          });

          console.log('response status', resp.status, resp.statusText);
          const json = await resp.json().catch(() => null);
          console.log('response json', json);
          if (!resp.ok) {
            throw new Error(json?.error || `Request failed (${resp.status})`);
          }

          const articleId = (json?.articleId || '').toString();
          if (!articleId) throw new Error('Missing articleId from start response');

          setState((s) => ({ ...s, articleId }));
          // Poll loop effect will take over once articleId is set.
        } catch (e) {
          console.error('generation start failed', e);
          clearTimers();
          clearPoll();
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

