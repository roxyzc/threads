import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdatePhotoProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  fileId: string;

  constructor(partial: Partial<UpdatePhotoProfileDto>) {
    Object.assign(this, partial);
  }
}
