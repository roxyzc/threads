import { IsEnum, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { GENDER } from 'src/app/entities/profile.entity';

export class UpdateProfileDto {
  @IsEnum(GENDER)
  @IsOptional()
  gender?: GENDER;

  @IsUrl()
  @IsOptional()
  @MaxLength(255)
  url?: string;
}
