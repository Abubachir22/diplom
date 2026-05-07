import React, { useRef } from "react";

const fmt = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return m + ":" + sec;
};

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (t: number) => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({ isPlaying, currentTime, duration, onPlay, onPause, onSeek }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getTimeFromEvent = (e: MouseEvent | React.MouseEvent): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    onSeek(getTimeFromEvent(e));

    const handleMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      onSeek(getTimeFromEvent(ev));
    };

    const handleUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", flexWrap: "wrap" }}>
      <button className="btn-icon" onClick={isPlaying ? onPause : onPlay} style={{ fontSize: "1.5rem" }}>
        {isPlaying ? "⏸" : "▶️"}
      </button>
      <div
        ref={trackRef}
        style={{ flex: 1, minWidth: "100px", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", cursor: "pointer", position: "relative" }}
        onMouseDown={handleMouseDown}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--accent-purple), var(--accent-blue))", borderRadius: "4px", transition: isDragging.current ? "none" : "width 0.1s linear" }} />
        <div style={{ position: "absolute", left: `${pct}%`, top: "50%", transform: "translate(-50%, -50%)", width: "14px", height: "14px", background: "#fff", borderRadius: "50%", boxShadow: "0 0 6px rgba(0,0,0,0.5)", cursor: "grab", transition: isDragging.current ? "none" : "left 0.1s linear" }} />
      </div>
      <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", minWidth: "90px", textAlign: "right" }}>{fmt(currentTime)} / {fmt(duration)}</span>
    </div>
  );
};

export default PlayerControls;