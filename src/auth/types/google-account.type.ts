export type GoogleAccount = {
  provider: 'GOOGLE';
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl: string | null;
};
