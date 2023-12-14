import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { isAlphanumericAndSpace } from 'src/app/core/decorators/IsAlphanumericAndSpace.decorator';

export class FollowUserDto {
  @IsString()
  @IsNotEmpty()
  @isAlphanumericAndSpace()
  @MinLength(8)
  @MaxLength(30)
  username: string;
}
