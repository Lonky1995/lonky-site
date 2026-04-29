"use client";

import { useRef, useState, useEffect } from "react";

export function PodcastPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const seconds = (e as CustomEvent<number>).detail;
      if (audioRef.current) {
        audioRef.current.currentTime = seconds;
        audioRef.current.play();
      }
    };
    document.addEventListener("podcast-seek", handler);
    return () => document.removeEventListener("podcast-seek", handler);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  function seek(e: React.MouseEvent) {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="sticky top-16 z-10 mb-8 flex items-center gap-3 rounded-xl border border-border bg-card/95 backdrop-blur px-4 py-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        onClick={toggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25"
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l10-5.5z"/></svg>
        )}
      </button>
      <span className="text-xs tabular-nums text-muted w-10 shrink-0">{fmt(current)}</span>
      <div
        ref={progressRef}
        onClick={seek}
        className="relative flex-1 h-1.5 cursor-pointer rounded-full bg-border"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted w-10 shrink-0 text-right">{duration > 0 ? fmt(duration) : "--:--"}</span>
    </div>
  );
}
