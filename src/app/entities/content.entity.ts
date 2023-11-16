import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  JoinTable,
  Index,
} from 'typeorm';
import { ImageContent } from './imageContent.entity';
import { Tag } from './tag.entity';
import { User } from './user.entity';
// import { LikeContent } from './likeContent.entity';
import { Comment } from './comment.entity';
import { Like } from './likes.entity';

export enum STATUS_CONTENT {
  public = 'public',
  private = 'private',
  deleted = 'deleted',
}

@Entity()
export class Content {
  @PrimaryGeneratedColumn('uuid')
  contentId: string;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  @Index('i_fulltext_content', { fulltext: true })
  content: string;

  @Column({
    type: 'enum',
    default: STATUS_CONTENT.public,
    enum: STATUS_CONTENT,
  })
  status: STATUS_CONTENT;

  @OneToMany(() => ImageContent, (image) => image.content)
  @JoinColumn()
  images?: ImageContent[];

  @ManyToOne(() => User, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'content_tags',
  })
  tags: Tag[];

  @OneToMany(() => Comment, (comment) => comment.content)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.content)
  likes?: Like[];

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  updatedAt: number;
}
