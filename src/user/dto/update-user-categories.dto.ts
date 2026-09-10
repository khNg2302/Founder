import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class UpdateUserCategoriesDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  categoryIds: string[];
}
