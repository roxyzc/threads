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

  @IsEnum(GENDER)
  @IsOptional()
  gender?: GENDER;

  @IsUrl()
  @IsOptional()
  @MaxLength(255)
  url?: string;
}
