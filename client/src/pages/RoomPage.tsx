import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoPlayer from "../components/room/VideoPlayer";
import ChatBox from "../components/room/ChatBox";
import ParticipantList from "../components/room/ParticipantList";
import GlassCard from "../components/ui/GlassCard";
import { useSocket } from "../hooks/useSocket";
import { useTranslation } from "../i18n/LanguageContext";
import type { Message, RoomParticipant } from "../types";

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || undefined;
  const { socket, connected, joinRoom, leaveRoom, emit, on } = useSocket(token);
  const { t } = useTranslation();

  const userStr = localStorage.getItem("user");
  const getGuestId = () => {
    let id = sessionStorage.getItem("guestId");
    if (!id) {
      id = "guest_" + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem("guestId", id);
    }
    return id;
  };
  const guestId = getGuestId();

  const currentUser = useRef({
    id: userStr ? JSON.parse(userStr).id : guestId,
    username: userStr ? JSON.parse(userStr).username : "Guest_" + guestId.slice(-4),
  });
  
  const [isOwner, setIsOwner] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
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
    setCurrentTime(data.time);
    setIsPlaying(data.isPlaying);
    pendingState.current = null;
  }, []);

  useEffect(() => {
    if (!roomId || !connected || hasJoined.current) return;
    hasJoined.current = true;
    joinRoom(roomId, currentUser.current.username, !userStr ? guestId : undefined);
    emit("sync:request-state", roomId);
    setMessages((prev) => [...prev, {
      id: "sys-welcome",
      text: "Welcome to the room!",
      userId: "system",
      username: "System",
      roomId,
      createdAt: new Date().toISOString(),
      isSystem: true,
    }]);
    return () => {
      hasJoined.current = false;
      leaveRoom(roomId);
    };
  }, [roomId, connected]);

  useEffect(() => {
    if (!socket || !roomId) return;
    const cleanups: (() => void)[] = [];

    cleanups.push(
      on("user:joined", (data: any) => {
        setMessages((prev) => [...prev, {
          id: "sys-" + Date.now(),
          text: data.username + " joined",
          userId: "system",
          username: "System",
          roomId,
          createdAt: new Date().toISOString(),
          isSystem: true,
        }]);
      }),

      on("user:left", (userId: any) => {
        setParticipants((prev) => prev.filter((p) => p.user.id !== userId));
      }),

      on("kicked", () => {
        alert(t('room.banned'));
        navigate('/rooms');
      }),

      on("sync:play", (data: any) => { setCurrentTime(data.time); setIsPlaying(true); }),
      on("sync:pause", (data: any) => { setCurrentTime(data.time); setIsPlaying(false); }),
      on("sync:seek", (data: any) => { setCurrentTime(data.time); }),
      on("sync:change-video", (data: any) => { setVideoUrl(data.videoUrl); setCurrentTime(0); setIsPlaying(false); setPlayerReady(false); }),

      on("sync:state-update", (data: any) => {
        pendingState.current = data;
        if (data.videoUrl) setVideoUrl(data.videoUrl);
        if (playerReady) applyPendingState();
      }),

      on("sync:request-state", (requesterId: any) => {
        emit("sync:state-response", {
          requesterId,
          videoUrl: videoUrlRef.current,
          time: currentTimeRef.current,
          isPlaying: isPlayingRef.current,
        });
      }),

      on("chat:message", (data: any) => {
        setMessages((prev) => (prev.find((m) => m.id === data.id) ? prev : [...prev, data]));
      }),

      on("room:users", (data: any) => {
        const myId = currentUser.current.id;
        const mapped: RoomParticipant[] = data.map((u: any) => {
          // Проверяем, создатель ли мы
          if (u.userId === myId && u.role === 'OWNER') {
            setIsOwner(true);
          }
          return {
            id: u.userId,
            role: u.role || "VIEWER",
            joinedAt: new Date().toISOString(),
            user: { id: u.userId, username: u.username, email: "" },
          };
        });
        setParticipants(mapped);
      }),
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

  const handleBan = async (userId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`http://localhost:5000/api/rooms/${roomId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setParticipants(prev => prev.filter(p => p.user.id !== userId));
    }
  };

  const handleTimeUpdate = useCallback((t: number) => { currentTimeRef.current = t; }, []);
  const handlePlayerReady = useCallback(() => { setPlayerReady(true); applyPendingState(); }, [applyPendingState]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-color)" }}>
      <div style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", background: "rgba(13,17,23,0.9)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => navigate("/rooms")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1.2rem" }}>{t('room.back')}</button>
          <h2 style={{ fontSize: "1.1rem" }}>{t('room.title')}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--accent-green)", fontWeight: 600 }}>{currentUser.current.username}</span>
          {isOwner && (
            <button className="btn btn-outline btn-sm" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={async () => {
              if (!window.confirm(t('room.deleteConfirm'))) return;
              const token = localStorage.getItem('token');
              const res = await fetch(`http://localhost:5000/api/rooms/${roomId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
              if (res.ok) navigate('/rooms');
              else { const data = await res.json(); alert(data.error || 'Error'); }
            }}>{t('room.delete')}</button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(window.location.href)}>{t('room.copyInvite')}</button>
        </div>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr 320px", gap: "16px", padding: "16px", overflow: "hidden", minHeight: 0 }}>
        <GlassCard style={{ overflowY: "auto", padding: 0 }}>
          <ParticipantList
            participants={participants}
            currentUserId={currentUser.current.id}
            isOwner={isOwner}
            onBan={handleBan}
          />
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