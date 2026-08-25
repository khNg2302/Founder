export type OAuthAccount = {
  provider: 'GOOGLE' | 'GITHUB';
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl: string | null;
};
