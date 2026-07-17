export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

export type SessionPayload = {
  unionId: string;
  clientId: string;
  twoFactorVerified?: boolean;
};

export type TwoFactorPendingPayload = {
  unionId: string;
  clientId: string;
  twoFactorPending: true;
};

export type UserProfile = {
  user_id: string;
  name: string;
  avatar_url: string;
};
