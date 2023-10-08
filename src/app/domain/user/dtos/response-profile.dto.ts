import { Expose, Exclude } from 'class-transformer';
import { GENDER } from 'src/app/entities/profile.entity';

export class ResponseProfile {
  profileId: string;

  @Exclude()
  firstName: string;

  @Exclude()
  lastName: string;

  fullName: string;
  gender: GENDER;

  @Expose({ name: 'image' })
  photo: string;

  @Exclude()
  userId: string;

  constructor(partial: Partial<ResponseProfile>) {
    Object.assign(this, partial);
  }
}
