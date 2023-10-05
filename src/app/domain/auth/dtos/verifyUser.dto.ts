import {
  IsString,
  IsNotEmpty,
  IsStrongPassword,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class ResendUserVerificationDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class VerifyUserDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class VerifyResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsStrongPassword()
  @MaxLength(30)
  newPassword: string;
}
