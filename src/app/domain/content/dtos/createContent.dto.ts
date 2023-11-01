import {
  IsString,
  MaxLength,
  IsOptional,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { TagDto } from './tag.dto';
import { Type } from 'class-transformer';
import {
  IsValidationArray,
  IsUniqueTagName,
} from 'src/app/core/decorators/IsValidationArray.decorator';

export class CreateContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsArray()
  @ArrayMaxSize(5, { message: 'Maximum 5 tags are allowed.' })
  @Type(() => TagDto)
  @IsUniqueTagName({ each: true })
  @IsValidationArray({ each: true })
  @IsOptional()
  tags?: TagDto[];
}
