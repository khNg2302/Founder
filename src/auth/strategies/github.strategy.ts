import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

import { OAuthAccount } from '../types/oauth-account.type';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<OAuthAccount> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException('GitHub account has no email');
    }

    const oauthAccount: OAuthAccount = {
      provider: 'GITHUB',
      providerAccountId: profile.id,
      email: email.toLowerCase(),
      emailVerified: true,
      name: profile.displayName ?? profile.username ?? '',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    return oauthAccount;
  }
}
