import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { IsAlphaAndSpace } from 'src/app/core/decorators/IsAlphaAndSpace.decorator';
import { GENDER } from 'src/app/entities/profile.entity';

export class UpdateProfileDto {
  @IsString()
  @IsAlphaAndSpace()
  firstName: string;

  @IsOptional()
  @IsString()
  @IsAlphaAndSpace()
  lastName?: string;

  @IsOptional()
  @IsEnum(GENDER)
  gender?: GENDER;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  url?: string;
}
