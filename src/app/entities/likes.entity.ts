import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Content } from './content.entity';
import { Comment } from './comment.entity';
import { User } from './user.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn('uuid')
  likeId: string;

  @Column({ type: 'varchar', nullable: false })
  userId: string;

  @Column({ nullable: true })
  contentId: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'contentId', referencedColumnName: 'contentId' })
  content: Content;

  @Column({ nullable: true })
  commentId: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commentId', referencedColumnName: 'commentId' })
  comment: Comment;

  @OneToOne(() => User, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  user: User;
}
