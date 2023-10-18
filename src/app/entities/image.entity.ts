import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Content } from './content.entity';

@Entity()
export class Image {
  @PrimaryGeneratedColumn('uuid')
  imageId: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  fileId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  url: string;

  @OneToOne(() => Profile, (profile) => profile.photo, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  profile?: Profile;

  @ManyToOne(() => Content, (content) => content.images, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  content?: Content;
}
