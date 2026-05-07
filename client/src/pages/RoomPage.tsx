import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoPlayer from "../components/room/VideoPlayer";
import ChatBox from "../components/room/ChatBox";
import ParticipantList from "../components/room/ParticipantList";
import GlassCard from "../components/ui/GlassCard";
import { useSocket } from "../hooks/useSocket";
import type { Message, RoomParticipant } from "../types";

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || undefined;
  const { socket, connected, joinRoom, leaveRoom, emit, on } = useSocket(token);

  const userStr = localStorage.getItem("user");
  const currentUser = useRef({
    id: userStr ? JSON.parse(userStr).id : "guest_" + Math.random().toString(36).slice(2, 8),
    username: userStr ? JSON.parse(userStr).username : "Guest_" + Math.random().toString(36).slice(2, 6),
  });

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>([
    {
      id: currentUser.current.id,
      role: "OWNER",
      joinedAt: new Date().toISOString(),
      user: { id: currentUser.current.id, username: currentUser.current.username, email: "" },
    },
  ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const hasJoined = useRef(false);
  const pendingState = useRef<any>(null);

  const videoUrlRef = useRef(videoUrl);
  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { videoUrlRef.current = videoUrl; }, [videoUrl]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const applyPendingState = useCallback(() => {
    if (!pendingState.current) return;
    const data = pendingState.current;
    console.log("[ROOMPAGE] Applying pending state:", data);
    setCurrentTime(data.time);
    setIsPlaying(data.isPlaying);
    pendingState.current = null;
  }, []);

  // Вход в комнату
  useEffect(() => {
    if (!roomId || !connected || hasJoined.current) return;
    hasJoined.current = true;
    joinRoom(roomId, currentUser.current.username);
    emit("sync:request-state", roomId);
    return () => {
      hasJoined.current = false;
      leaveRoom(roomId);
    };
  }, [roomId, connected]);

  // Обработчики
  useEffect(() => {
    if (!socket || !roomId) return;
    const cleanups: (() => void)[] = [];

    cleanups.push(
      on("user:joined", (data: any) => {
        setParticipants((prev) => {
          if (prev.find((p) => p.user.id === data.id)) return prev;
          return [...prev, { id: data.id, role: data.role || "VIEWER", joinedAt: data.joinedAt, user: { id: data.id, username: data.username, email: "" } }];
        });
        setMessages((prev) => [...prev, { id: "sys-" + Date.now(), text: data.username + " joined", userId: "system", username: "System", roomId, createdAt: new Date().toISOString(), isSystem: true }]);
      }),
      on("user:left", (userId: any) => setParticipants((prev) => prev.filter((p) => p.user.id !== userId))),
      on("sync:play", (data: any) => { setCurrentTime(data.time); setIsPlaying(true); }),
      on("sync:pause", (data: any) => { setCurrentTime(data.time); setIsPlaying(false); }),
      on("sync:seek", (data: any) => { setCurrentTime(data.time); }),
      on("sync:change-video", (data: any) => { setVideoUrl(data.videoUrl); setCurrentTime(0); setIsPlaying(false); setPlayerReady(false); }),
      on("sync:state-update", (data: any) => {
        console.log("[ROOMPAGE] sync:state-update", data);
        pendingState.current = data;
        if (data.videoUrl) setVideoUrl(data.videoUrl);
        if (playerReady) applyPendingState();
      }),
      on("sync:request-state", (requesterId: any) => {
        emit("sync:state-response", { requesterId, videoUrl: videoUrlRef.current, time: currentTimeRef.current, isPlaying: isPlayingRef.current });
      }),
      on("chat:message", (data: any) => setMessages((prev) => (prev.find((m) => m.id === data.id) ? prev : [...prev, data]))),
      on("room:users", (data: any) => {
        const myId = currentUser.current.id;
        const newUsers = data.filter((u: any) => u.userId !== myId).map((u: any) => ({ id: u.userId, role: u.role || "VIEWER", joinedAt: new Date().toISOString(), user: { id: u.userId, username: u.username, email: "" } }));
        setParticipants((prev) => {
          const mine = prev.filter((p) => p.user.id === myId);
          const merged = [...mine];
          newUsers.forEach((u: any) => { if (!merged.find((m) => m.user.id === u.user.id)) merged.push(u); });
          return merged;
        });
      })
    );

    return () => cleanups.forEach((c) => c());
  }, [socket, roomId, playerReady, applyPendingState]);

  const handlePlay = useCallback(() => { setIsPlaying(true); emit("sync:play", { roomId, time: currentTimeRef.current }); }, [roomId, emit]);
  const handlePause = useCallback(() => { setIsPlaying(false); emit("sync:pause", { roomId, time: currentTimeRef.current }); }, [roomId, emit]);
  const handleSeek = useCallback((t: number) => { setCurrentTime(t); emit("sync:seek", { roomId, time: t }); }, [roomId, emit]);
  const handleVideoChange = useCallback((url: string) => {
    setVideoUrl(url); setCurrentTime(0); setIsPlaying(false); setPlayerReady(false);
    emit("sync:change-video", { roomId, videoUrl: url });
    setMessages((prev) => [...prev, { id: "sys-" + Date.now(), text: "Video changed", userId: "system", username: "System", roomId: roomId || "", createdAt: new Date().toISOString(), isSystem: true }]);
  }, [roomId, emit]);
  const handleSend = useCallback((text: string) => { emit("chat:send", { roomId, text, userId: currentUser.current.id, username: currentUser.current.username }); }, [roomId, emit]);

  const handleTimeUpdate = useCallback((t: number) => {
    currentTimeRef.current = t;
  }, []);

  const handlePlayerReady = useCallback(() => {
    console.log("[ROOMPAGE] Player ready");
    setPlayerReady(true);
    applyPendingState();
  }, [applyPendingState]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-color)" }}>
      <div style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", background: "rgba(13,17,23,0.9)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => navigate("/rooms")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1.2rem" }}>Back</button>
          <h2 style={{ fontSize: "1.1rem" }}>Watch Room</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--accent-green)", fontWeight: 600 }}>{currentUser.current.username}</span>
          {participants.find(p => p.user.id === currentUser.current.id && p.role === 'OWNER') && (
            <button
              className="btn btn-outline btn-sm"
              style={{ color: '#EF4444', borderColor: '#EF4444' }}
              onClick={async () => {
                if (!window.confirm('Удалить комнату? Это действие нельзя отменить.')) return;
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                  navigate('/rooms');
                } else {
                  const data = await res.json();
                  alert(data.error || 'Ошибка при удалении комнаты');
                }
              }}
            >
              Delete Room
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy Invite</button>
        </div>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr 320px", gap: "16px", padding: "16px", overflow: "hidden", minHeight: 0 }}>
        <GlassCard style={{ overflowY: "auto", padding: 0 }}>
          <ParticipantList participants={participants} currentUserId={currentUser.current.id} />
        </GlassCard>
        <VideoPlayer videoUrl={videoUrl} isPlaying={isPlaying} currentTime={currentTime} onPlay={handlePlay} onPause={handlePause} onSeek={handleSeek} onVideoChange={handleVideoChange} onTimeUpdate={handleTimeUpdate} onReady={handlePlayerReady} />
        <GlassCard style={{ overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}>
          <ChatBox messages={messages} currentUserId={currentUser.current.id} onSend={handleSend} />
        </GlassCard>
      </div>
    </div>
  );
};

export default RoomPage;