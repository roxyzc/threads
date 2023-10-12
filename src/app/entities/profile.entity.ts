import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Image } from './image.entity';

export enum GENDER {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
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
  @Index('IFT_FullName', { fulltext: true })
  fullName: string;

  @Column({ type: 'enum', default: GENDER.OTHER, enum: GENDER })
  gender: GENDER;

  @OneToOne(() => Image, (image) => image.profile)
  @JoinColumn({ name: 'imageId' })
  photo?: Image;

  @OneToOne(() => User, (user) => user.profile, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
