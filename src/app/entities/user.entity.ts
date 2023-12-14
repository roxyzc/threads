import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { Token } from './token.entity';
import { Profile } from './profile.entity';
import { Followship } from './followship.entity';

export enum UserRoles {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum UserActive {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 30, nullable: false, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 317, nullable: false, unique: true })
  @Index('i_email')
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @Column({ type: 'enum', enum: UserRoles, default: UserRoles.USER })
  role: UserRoles;

  @Column({ type: 'enum', enum: UserActive, default: UserActive.INACTIVE })
  active: UserActive;

  @OneToOne(() => Token, (token) => token.user)
  token: Token;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  @OneToOne(() => Followship, (followship) => followship.user)
  followship: Followship;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  updatedAt: number;
}
