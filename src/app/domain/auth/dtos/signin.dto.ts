import {
  IsStrongPassword,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { isAlphanumericAndSpace } from 'src/app/core/decorators/IsAlphanumericAndSpace.decorator';

export class SigninDto {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @isAlphanumericAndSpace()
  username: string;

  @IsNotEmpty()
  @IsStrongPassword()
  @MaxLength(30)
  password: string;
}
