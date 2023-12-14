import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
  Column,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Followship {
  @PrimaryGeneratedColumn('uuid')
  followerId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  userId: string;

  @OneToOne(() => User, (user) => user.followship, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  user: User;

  @Column({ type: 'integer', default: 0, nullable: true })
  followerCount: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  followedCount: number;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @ManyToMany(() => User)
  @JoinTable({ name: 'follower_user' })
  follower?: User[];

  @ManyToMany(() => User)
  @JoinTable({ name: 'followed_user' })
  followed?: User[];
}
