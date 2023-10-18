import { Exclude, Expose } from 'class-transformer';
import { GENDER, Profile } from 'src/app/entities/profile.entity';
import { UserActive, UserRoles } from 'src/app/entities/user.entity';

export class ResponseAuth {
  userId: string;
  email: string;
  username: string;
  active: UserActive;
  role: UserRoles;
  token: string;

  @Exclude()
  password: string;

  @Expose({ name: 'created_at' })
  createdAt: number;

  @Expose({ name: 'updated_at' })
  updatedAt: number;

  constructor(partial: Partial<ResponseAuth>) {
    Object.assign(this, partial);
  }
}

export class ResponseAuthRaw {
  userId: string;
  email: string;
  username: string;
  active: UserActive;
  role: UserRoles;
  fullName: string;
  gender: GENDER;
  image: string;

  @Exclude()
  password: string;

  @Exclude()
  profile: Profile;

  @Expose({ name: 'created_at' })
  createdAt: number;

  @Expose({ name: 'updated_at' })
  updatedAt: number;

  constructor(partial: Partial<ResponseAuthRaw>) {
    Object.assign(this, partial);
  }
}
