export type SidebarRoom = {
  id: string;
  name: string;
  memberRole: string;
};

export type SidebarProject = {
  id: string;
  name: string;
  slug: string;
  rooms: SidebarRoom[];
};

export type SidebarResponse = {
  currentUser: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  projects: SidebarProject[];
};

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  type: "TEXT" | "CODE" | "DIFF" | "SYSTEM";
  content: string;
  createdAt: string;
};

export type ChatWsIncoming =
  | { type: "connected"; userId: string }
  | { type: "subscribed"; roomId: string }
  | { type: "message:new"; message: ChatMessage }
  | { type: "error"; message: string };
