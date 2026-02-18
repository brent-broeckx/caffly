export type CoreUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  githubUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCoreUserInput = {
  username?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  githubUserId?: string;
};
