import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AccountModule } from '../account/account.module';
import { UserModule } from '../user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionController } from './session.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { ReactivationTokenService } from './reactivation-token.service';
import { TokenModule } from 'src/common/security/token/token.module';
import { RoleModule } from 'src/role/role.module';
import { RefreshTokenModule } from 'src/common/security/token/refresh-token.module';
import { PasswordResetTokenService } from './password-reset-token.service';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    AccountModule,
    TokenModule,
    RoleModule,
    RefreshTokenModule,

    JwtModule.registerAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),

        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],

  controllers: [AuthController, SessionController],

  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    ReactivationTokenService,
    PasswordResetTokenService,
  ],

  exports: [PasswordResetTokenService],
})
export class AuthModule {}
