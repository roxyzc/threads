import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ImageProfile } from './imageProfile.entity';

export enum GENDER {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum STATUS_PROFILE {
  public = 'public',
  private = 'private',
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  profileId: string;

  @Column({ type: 'varchar', nullable: false, length: 50 })
  firstName: string;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  fullName: string;

  @Column({ type: 'enum', default: GENDER.OTHER, enum: GENDER })
  gender: GENDER;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  bio: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  url: string;

  @Column({
    type: 'enum',
    default: STATUS_PROFILE.public,
    enum: STATUS_PROFILE,
  })
  status: STATUS_PROFILE;

  @OneToOne(() => ImageProfile, (image) => image.profile)
  @JoinColumn({ name: 'imageId' })
  photo?: ImageProfile;

  @OneToOne(() => User, (user) => user.profile, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
