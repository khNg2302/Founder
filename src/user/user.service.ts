import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaTransaction } from 'prisma/prisma.types';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto, tx: PrismaTransaction = this.prisma) {
    return tx.user.create({
      data,
    });
  }
}
