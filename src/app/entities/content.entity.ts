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

@Entity()
export class Content {
  @PrimaryGeneratedColumn('uuid')
  contentId: string;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  content: string;

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

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  updatedAt: number;
}
