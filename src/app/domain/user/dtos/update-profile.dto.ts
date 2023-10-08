import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GENDER } from 'src/app/entities/profile.entity';

export class UpdateProfileDto {
  @IsEnum(GENDER)
  @IsOptional()
  gender?: GENDER;

  @IsString()
  @IsOptional()
  photo?: string;
}
