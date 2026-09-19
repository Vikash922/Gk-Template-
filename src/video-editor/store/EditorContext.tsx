import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { VideoProject, Clip, Track, SelectionState } from '../types';
import { projectStore } from './ProjectStore';
import { createEmptyProject } from '../engine/GKVideoGenerator';

interface EditorContextType {
  project: VideoProject;
  currentTime: number;
  isPlaying: boolean;
  timelineZoom: number;
  selection: SelectionState;
  selectedClip: Clip | null;
  selectedTrack: Track | null;
  autosaveState: 'saved' | 'saving' | 'unsaved';
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setProject: (project: VideoProject) => void;
  updateProject: (updater: (prev: VideoProject) => VideoProject, addToHistory?: boolean) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
  setTimelineZoom: (zoom: number) => void;
  setSelection: (selection: SelectionState) => void;
  selectClip: (clipId: string | null) => void;

  // History
  undo: () => void;
  redo: () => void;
  saveProjectNow: () => Promise<void>;

  // Clip Operations
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  deleteClip: (clipId: string) => void;
  duplicateClip: (clipId: string) => void;
  splitClipAtPlayhead: (clipId: string) => void;
  moveClip: (clipId: string, targetTrackId: string, newStartTime: number) => void;
  trimClip: (clipId: string, newStartTime: number, newDuration: number) => void;
  addClipToTrack: (trackId: string, clip: Clip) => void;

  // Track Operations
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackHide: (trackId: string) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{
  initialProject?: VideoProject;
  children: React.ReactNode;
}> = ({ initialProject, children }) => {
  const [project, setProjectState] = useState<VideoProject>(() => initialProject || createEmptyProject());
  const [currentTime, setCurrentTimeState] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timelineZoom, setTimelineZoom] = useState<number>(100); // 100 pixels = 1 second
  const [selection, setSelection] = useState<SelectionState>({
    clipId: null,
    trackId: null,
    keyframeId: null,
  });

  const [autosaveState, setAutosaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Undo / Redo Stacks
  const pastRef = useRef<VideoProject[]>([]);
  const futureRef = useRef<VideoProject[]>([]);
  const [historyVersion, setHistoryVersion] = useState<number>(0);

  // Autosave Timer
  const autosaveTimerRef = useRef<any>(null);

  // Sync initialProject when updated
  useEffect(() => {
    if (initialProject) {
      setProjectState(initialProject);
      setCurrentTimeState(0);
      setSelection({ clipId: null, trackId: null, keyframeId: null });
    }
  }, [initialProject]);

  // Playhead requestAnimationFrame loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // ── Project Update with Undo Support ──
  const updateProject = useCallback(
    (updater: (prev: VideoProject) => VideoProject, addToHistory: boolean = true) => {
      setProjectState((prev) => {
        if (addToHistory) {
          pastRef.current.push(JSON.parse(JSON.stringify(prev)));
          if (pastRef.current.length > 30) pastRef.current.shift();
          futureRef.current = [];
          setHistoryVersion((v) => v + 1);
        }

        const next = updater(prev);
        setAutosaveState('unsaved');
        return next;
      });
    },
    []
  );

  const setProject = useCallback((newProj: VideoProject) => {
    pastRef.current = [];
    futureRef.current = [];
    setHistoryVersion((v) => v + 1);
    setProjectState(newProj);
    setCurrentTimeState(0);
    setSelection({ clipId: null, trackId: null, keyframeId: null });
    setAutosaveState('saved');
  }, []);

  // ── Autosave Trigger ──
  useEffect(() => {
    if (autosaveState === 'unsaved') {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(async () => {
        setAutosaveState('saving');
        try {
          await projectStore.saveProject(project);
          setAutosaveState('saved');
        } catch {
          setAutosaveState('unsaved');
        }
      }, 2500);
    }
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [project, autosaveState]);

  const saveProjectNow = useCallback(async () => {
    setAutosaveState('saving');
    try {
      await projectStore.saveProject(project);
      setAutosaveState('saved');
    } catch {
      setAutosaveState('unsaved');
    }
  }, [project]);

  // ── Undo & Redo ──
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current.pop()!;
    futureRef.current.push(JSON.parse(JSON.stringify(project)));
    setProjectState(previous);
    setHistoryVersion((v) => v + 1);
  }, [project]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    pastRef.current.push(JSON.parse(JSON.stringify(project)));
    setProjectState(next);
    setHistoryVersion((v) => v + 1);
  }, [project]);

  // ── Playhead Transport Loop ──
  const setCurrentTime = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(project.duration || 10, t));
      setCurrentTimeState(clamped);
    },
    [project.duration]
  );

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = () => {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTimeState((prev) => {
        const next = prev + delta;
        if (next >= project.duration) {
          setIsPlaying(false);
          return 0; // Loop back to start or pause
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, project.duration]);

  // ── Find Selected Clip / Track ──
  let selectedClip: Clip | null = null;
  let selectedTrack: Track | null = null;
  if (selection.clipId) {
    for (const t of project.tracks) {
      const found = t.clips.find((c) => c.id === selection.clipId);
      if (found) {
        selectedClip = found;
        selectedTrack = t;
        break;
      }
    }
  }

  const selectClip = useCallback(
    (clipId: string | null) => {
      if (!clipId) {
        setSelection({ clipId: null, trackId: null, keyframeId: null });
        return;
      }
      for (const t of project.tracks) {
        if (t.clips.some((c) => c.id === clipId)) {
          setSelection({ clipId, trackId: t.id, keyframeId: null });
          break;
        }
      }
    },
    [project.tracks]
  );

  // ── Clip Operations ──
  const updateClip = useCallback(
    (clipId: string, updates: Partial<Clip>) => {
      updateProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
        })),
      }));
    },
    [updateProject]
  );

  const deleteClip = useCallback(
    (clipId: string) => {
      updateProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => ({
          ...t,
          clips: t.clips.filter((c) => c.id !== clipId),
        })),
      }));
      setSelection({ clipId: null, trackId: null, keyframeId: null });
    },
    [updateProject]
  );

  const duplicateClip = useCallback(
    (clipId: string) => {
      updateProject((prev) => {
        let cloned: Clip | null = null;
        let trackTargetId = '';

        for (const t of prev.tracks) {
          const c = t.clips.find((item) => item.id === clipId);
          if (c) {
            trackTargetId = t.id;
            cloned = {
              ...JSON.parse(JSON.stringify(c)),
              id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name: `${c.name} (Copy)`,
              startTime: c.startTime + c.duration + 0.2,
            };
            break;
          }
        }

        if (!cloned) return prev;

        return {
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.id === trackTargetId ? { ...t, clips: [...t.clips, cloned!] } : t
          ),
        };
      });
    },
    [updateProject]
  );

  const splitClipAtPlayhead = useCallback(
    (clipId: string) => {
      updateProject((prev) => {
        let trackId = '';
        let targetClip: Clip | null = null;

        for (const t of prev.tracks) {
          const c = t.clips.find((item) => item.id === clipId);
          if (c) {
            trackId = t.id;
            targetClip = c;
            break;
          }
        }

        if (!targetClip) return prev;
        const splitPoint = currentTime;
        if (splitPoint <= targetClip.startTime || splitPoint >= targetClip.startTime + targetClip.duration) {
          return prev;
        }

        const leftDuration = splitPoint - targetClip.startTime;
        const rightDuration = targetClip.duration - leftDuration;

        const leftClip: Clip = {
          ...JSON.parse(JSON.stringify(targetClip)),
          duration: leftDuration,
        };

        const rightClip: Clip = {
          ...JSON.parse(JSON.stringify(targetClip)),
          id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: `${targetClip.name} (Part 2)`,
          startTime: splitPoint,
          duration: rightDuration,
        };

        return {
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.id === trackId
              ? {
                  ...t,
                  clips: t.clips.flatMap((c) => (c.id === clipId ? [leftClip, rightClip] : [c])),
                }
              : t
          ),
        };
      });
    },
    [currentTime, updateProject]
  );

  const moveClip = useCallback(
    (clipId: string, targetTrackId: string, newStartTime: number) => {
      updateProject((prev) => {
        let movingClip: Clip | null = null;

        // Remove from source track
        const tracksWithoutClip = prev.tracks.map((t) => {
          const match = t.clips.find((c) => c.id === clipId);
          if (match) movingClip = { ...match };
          return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
        });

        if (!movingClip) return prev;
        movingClip.trackId = targetTrackId;
        movingClip.startTime = Math.max(0, newStartTime);

        return {
          ...prev,
          tracks: tracksWithoutClip.map((t) =>
            t.id === targetTrackId ? { ...t, clips: [...t.clips, movingClip!] } : t
          ),
        };
      });
    },
    [updateProject]
  );

  const trimClip = useCallback(
    (clipId: string, newStartTime: number, newDuration: number) => {
      updateProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  startTime: Math.max(0, newStartTime),
                  duration: Math.max(0.2, newDuration),
                }
              : c
          ),
        })),
      }));
    },
    [updateProject]
  );

  const addClipToTrack = useCallback(
    (trackId: string, clip: Clip) => {
      updateProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
        ),
      }));
    },
    [updateProject]
  );

  // ── Track Operations ──
  const toggleTrackMute = useCallback(
    (trackId: string) => {
      updateProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
      }));
    },
    [updateProject]
  );

  const toggleTrackLock = useCallback(
    (trackId: string) => {
      updateProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t)),
      }));
    },
    [updateProject]
  );

  const toggleTrackHide = useCallback(
    (trackId: string) => {
      updateProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, hidden: !t.hidden } : t)),
      }));
    },
    [updateProject]
  );

  return (
    <EditorContext.Provider
      value={{
        project,
        currentTime,
        isPlaying,
        timelineZoom,
        selection,
        selectedClip,
        selectedTrack,
        autosaveState,
        canUndo: pastRef.current.length > 0,
        canRedo: futureRef.current.length > 0,
        setProject,
        updateProject,
        setCurrentTime,
        setIsPlaying,
        togglePlayPause,
        setTimelineZoom,
        setSelection,
        selectClip,
        undo,
        redo,
        saveProjectNow,
        updateClip,
        deleteClip,
        duplicateClip,
        splitClipAtPlayhead,
        moveClip,
        trimClip,
        addClipToTrack,
        toggleTrackMute,
        toggleTrackLock,
        toggleTrackHide,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
};
