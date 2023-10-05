import {
  EntitySubscriberInterface,
  EventSubscriber,
  DataSource,
  InsertEvent,
} from 'typeorm';
import { User } from '../../entities/user.entity';
import { hash } from 'src/app/utils/hash.util';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): typeof User {
    return User;
  }

  async beforeInsert(event: InsertEvent<User>): Promise<void> {
    const date = new Date().getTime();
    const hashedPassword = await hash(event.entity.password);
    event.entity.password = hashedPassword;
    event.entity.createdAt = date;
    event.entity.updatedAt = date;
  }
}
