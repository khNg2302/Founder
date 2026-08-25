import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { OAuthAccount } from './types/oauth-account.type';
import { GitHubAuthGuard } from './guards/github-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Passport sẽ redirect sang Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request) {
    return this.authService.loginWithOAuth(req.user as OAuthAccount);
  }

  @Get('github')
  @UseGuards(GitHubAuthGuard)
  githubLogin() {}

  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  async githubCallback(@Req() req: Request) {
    return this.authService.loginWithOAuth(req.user as OAuthAccount);
  }
}
