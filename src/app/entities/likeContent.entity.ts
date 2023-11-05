import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content } from './content.entity';

@Entity()
export class LikeContent {
  @PrimaryGeneratedColumn('uuid')
  likeContentId: string;

  @ManyToOne(() => Content, (content) => content.likes, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'contentId',
  })
  content: Content;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  userId: string;
}
