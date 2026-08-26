import { IsString, MinLength } from 'class-validator';

export class ReactivateAccountDto {
  @IsString()
  @MinLength(1)
  token: string;
}
