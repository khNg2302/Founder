import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class UpdateUserAudiencesDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  audienceTypeIds: string[];
}
