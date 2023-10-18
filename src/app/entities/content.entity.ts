import {
  Column,
  Entity,
  JoinTable,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Image } from './image.entity';

@Entity()
export class Content {
  @PrimaryGeneratedColumn('uuid')
  contentId: string;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  content: string;

  @OneToMany(() => Image, (image) => image.content)
  @JoinTable({ name: 'contents' })
  images: Image[];

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true, unsigned: true })
  updatedAt: number;
}
