import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';

import { AdminService } from './admin.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Permissions('user:read')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('users/:id')
  @Permissions('user:read')
  findUserById(@Param('id') id: string) {
    return this.adminService.findUserById(id);
  }

  @Post('users')
  @Permissions('user:create')
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  @Permissions('user:update')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Patch('users/:id/disable')
  @Permissions('user:update')
  disableUser(@Param('id') id: string) {
    return this.adminService.disableUser(id);
  }

  @Patch('users/:id/roles/:roleId')
  @Permissions('user:update')
  assignRole(@Param('id') userId: string, @Param('roleId') roleId: string) {
    return this.adminService.assignRole(userId, roleId);
  }

  @Patch('users/:id/enable')
  @Permissions('user:update')
  enableUser(@Param('id') id: string) {
    return this.adminService.enableUser(id);
  }
}
