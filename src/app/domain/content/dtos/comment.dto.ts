import { IsString, MaxLength, IsNotEmpty, MinLength } from 'class-validator';

export class CommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @MinLength(1)
  text: string;
}
