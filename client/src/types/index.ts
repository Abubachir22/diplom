export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface RoomParticipant {
  id: string;
  role: "OWNER" | "MODERATOR" | "VIEWER";
  user: User;
  joinedAt: string;
}

export interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  inviteCode: string;
  videoUrl: string | null;
  videoTime: number;
  isPlaying: boolean;
  creatorId: string;
  participants: RoomParticipant[];
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  username: string;
  roomId: string;
  createdAt: string;
  isSystem?: boolean;
}
