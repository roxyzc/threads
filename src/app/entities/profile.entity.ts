import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

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

  @Column({ type: 'varchar', length: 255, nullable: true })
  photo?: string;

  @OneToOne(() => User, (user) => user.profile, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
