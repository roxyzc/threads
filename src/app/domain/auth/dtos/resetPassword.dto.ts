import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
}
