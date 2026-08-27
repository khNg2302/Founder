import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateUserByAdminDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
