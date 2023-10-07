import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GENDER } from 'src/app/entities/profile.entity';

export class CreateProfileDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @IsEnum(GENDER)
  gender: GENDER;

  @IsString()
  @IsOptional()
  photo?: string;
}
