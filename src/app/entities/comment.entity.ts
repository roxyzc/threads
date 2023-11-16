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

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  commentId: string;

  @Column()
  text: string;

  @ManyToOne(() => User)
  user: User;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies: Comment[];

  @OneToMany(() => Like, (like) => like.comment)
  likes: Like[];

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  parentComment: Comment;

  @ManyToOne(() => Content, (content) => content.comments, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'content' })
  content: Content;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  updatedAt: number;
}
