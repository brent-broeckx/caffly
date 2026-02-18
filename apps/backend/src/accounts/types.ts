export type CoreAccount = {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
};

export type LinkAccountInput = {
  userId: string;
  provider: string;
  providerAccountId: string;
  type?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
};

export type OAuthAccountLinkInput = {
  provider: string;
  providerAccountId: string;
  email?: string;
  userIdHint?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  githubUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  type?: string;
};
