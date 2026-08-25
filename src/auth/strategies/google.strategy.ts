import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0];

    if (!email?.value) {
      throw new UnauthorizedException('Google account has no email');
    }

    return {
      provider: 'GOOGLE',
      providerAccountId: profile.id,
      email: email.value.toLowerCase(),
      emailVerified: email.verified === true,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
  }
}
