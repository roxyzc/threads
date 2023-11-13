import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IsAlphaAndSpace } from 'src/app/core/decorators/IsAlphaAndSpace.decorator';
import { GENDER } from 'src/app/entities/profile.entity';

export class CreateProfileDto {
  @IsString()
  @IsAlphaAndSpace()
  firstName: string;

  @IsString()
  @IsAlphaAndSpace()
  @IsOptional()
  lastName: string;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName ?? ''}`.trim();
  }

  @IsEnum(GENDER)
  gender: GENDER;
}

// @IsString()
// @IsOptional()
// photo?: string;
