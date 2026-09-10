import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ContributionService } from './contribution.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { CurrentAccessToken } from 'src/auth/decorators/current-access-token.decorator';

@Controller('contributions')
export class ContributionController {
  constructor(private readonly contributionService: ContributionService) {}

  @Get()
  findAll() {
    return this.contributionService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.contributionService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateContributionDto,
    @CurrentAccessToken() accessToken: string,
  ) {
    return this.contributionService.create(dto, accessToken);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContributionDto,
    @CurrentAccessToken() accessToken: string,
  ) {
    return this.contributionService.update(id, dto, accessToken);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.contributionService.delete(id);
  }
}
