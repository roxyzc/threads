import {
  IsAlphanumeric,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class TagDto {
  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  @IsAlphanumeric()
  name: string;

  get createdAt() {
    return new Date().getTime();
  }
}
