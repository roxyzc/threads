import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class FollowUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  username: string;
}
