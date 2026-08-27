import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateProfileDto } from 'src/auth/dto/update-profile.dto';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
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

  @Get()
  @Permissions('user:read')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Permissions('user:read')
  findById(@Param('id') id: string) {
    return this.userService.findByIdForAdmin(id);
  }

  @Post()
  @Permissions('user:create')
  create(@Body() dto: CreateUserByAdminDto) {
    return this.userService.createByAdmin(dto);
  }
}
