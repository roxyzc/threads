import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;
}
