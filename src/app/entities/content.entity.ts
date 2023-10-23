import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ImageContent } from './imageContent.entity';
import { Tag } from './tag.entity';

@Entity()
export class Content {
  @PrimaryGeneratedColumn('uuid')
  contentId: string;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  content: string;

  @Column({ type: 'varchar', nullable: false, length: 255 })
  userId: string;

  @OneToMany(() => ImageContent, (image) => image.content)
  @JoinColumn()
  images?: ImageContent[];

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
