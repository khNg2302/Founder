import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateProfileDto } from 'src/user/dto/update-profile.dto';
import { UpdateUserAudiencesDto } from './dto/update-user-audiences.dto';
import { UpdateUserCategoriesDto } from './dto/update-user-categories.dto';
import { CurrentAccessToken } from 'src/auth/decorators/current-access-token.decorator';

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

  @Get('me/categories')
  getMyCategories(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAccessToken() accessToken: string,
  ) {
    return this.userService.findCategories(user.userId, accessToken);
  }

  @Put('me/categories')
  replaceMyCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserCategoriesDto,
    @CurrentAccessToken() accessToken: string,
  ) {
    return this.userService.replaceCategories(
      user.userId,
      dto.categoryIds,
      accessToken,
    );
  }
}
