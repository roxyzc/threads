import { IsString, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { STATUS_CONTENT } from 'src/app/entities/content.entity';

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsEnum([STATUS_CONTENT.public, STATUS_CONTENT.private], {
    message: 'status must be one of the following values: public and private',
  })
  status: STATUS_CONTENT;
}
