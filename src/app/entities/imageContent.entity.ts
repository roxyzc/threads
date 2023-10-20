import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Content } from './content.entity';

@Entity()
export class ImageContent {
  @PrimaryGeneratedColumn('uuid')
  imageId: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  fileId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  url: string;

  @ManyToOne(() => Content, (content) => content.images, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  content: Content;
}
