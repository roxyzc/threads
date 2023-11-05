import {
  IsString,
  MaxLength,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { STATUS_CONTENT } from 'src/app/entities/content.entity';

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsUUID()
  @IsNotEmpty()
  contentId: string;

  @IsEnum(STATUS_CONTENT)
  status: STATUS_CONTENT;
}
