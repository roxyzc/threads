import { IsString, MaxLength, IsOptional, IsArray } from 'class-validator';
import { TagDto } from './tag.dto';
import { Type } from 'class-transformer';
import { IsValidationArray } from 'src/app/core/decorators/IsValidationArray.decorator';

export class CreateContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsArray()
  @Type(() => TagDto)
  @IsValidationArray({ each: true })
  @IsOptional()
  tags?: TagDto[];
}
