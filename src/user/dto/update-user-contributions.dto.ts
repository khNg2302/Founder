import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserContributionItemDto {
  @IsString()
  contributionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateUserContributionsDto {
  @IsArray()
  @ArrayUnique((item: UserContributionItemDto) => item.contributionId)
  @ValidateNested({ each: true })
  @Type(() => UserContributionItemDto)
  items: UserContributionItemDto[];
}
