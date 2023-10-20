import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ImageContent } from './imageContent.entity';

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

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  updatedAt: number;
}
