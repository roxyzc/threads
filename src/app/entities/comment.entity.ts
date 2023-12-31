import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Content } from './content.entity';
import { Like } from './likes.entity';

export enum STATUS_COMMENT {
  public = 'public',
  deleted = 'deleted',
}

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  commentId: string;

  @Column({ nullable: true, type: 'varchar', length: 500 })
  text: string;

  @ManyToOne(() => User, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies?: Comment[];

  @OneToMany(() => Like, (like) => like.comment)
  likes?: Like[];

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  parentComment?: Comment;

  @ManyToOne(() => Content, (content) => content.comments, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'content' })
  content: Content;

  @Column({
    type: 'enum',
    enum: STATUS_COMMENT,
    default: STATUS_COMMENT.public,
  })
  status: STATUS_COMMENT;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  updatedAt: number;
}
