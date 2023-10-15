import { Entity, PrimaryGeneratedColumn } from 'typeorm';

// masih binggung isinya apa

@Entity()
export class Content {
  @PrimaryGeneratedColumn('uuid')
  contentId: string;
}
