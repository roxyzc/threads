import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  JoinTable,
} from 'typeorm';
import { ImageContent } from './imageContent.entity';
import { Tag } from './tag.entity';
import { User } from './user.entity';
import { LikeContent } from './likeContent.entity';

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

  @ManyToMany(() => Tag, { cascade: true, onDelete: 'CASCADE' })
  @JoinTable({
    name: 'content_tags',
  })
  tags: Tag[];

  @OneToMany(() => LikeContent, (like) => like.content)
  likes?: LikeContent[];

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  updatedAt: number;
}
