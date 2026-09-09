import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateProfileDto } from 'src/user/dto/update-profile.dto';
import { UpdateUserAudiencesDto } from './dto/update-user-audiences.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.findById(user.userId);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.userId, dto);
  }

  @Get('me/audiences')
  getMyAudiences(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.findAudiences(user.userId);
  }

  @Put('me/audiences')
  replaceMyAudiences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserAudiencesDto,
  ) {
    return this.userService.replaceAudiences(user.userId, dto.audienceTypeIds);
  }
}
