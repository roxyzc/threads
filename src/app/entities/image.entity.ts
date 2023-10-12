import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Profile } from './profile.entity';

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
  profile: Profile;
}
