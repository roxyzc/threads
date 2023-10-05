import {
  IsString,
  IsStrongPassword,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';
import { isAlphanumericAndSpace } from 'src/app/core/decorators/IsAlphanumericAndSpace.decorator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @isAlphanumericAndSpace()
  @MinLength(8)
  @MaxLength(30)
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword()
  @MaxLength(30)
  password: string;

  @IsNotEmpty()
  @IsStrongPassword()
  @MaxLength(30)
  confirmPassword: string;
}
