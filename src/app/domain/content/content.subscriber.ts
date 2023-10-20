import {
  EntitySubscriberInterface,
  EventSubscriber,
  DataSource,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Content } from 'src/app/entities/content.entity';

@EventSubscriber()
export class ContentSubscriber implements EntitySubscriberInterface<Content> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): typeof Content {
    return Content;
  }

  async beforeInsert(event: InsertEvent<Content>): Promise<void> {
    const date = new Date().getTime();
    event.entity.createdAt = date;
    event.entity.updatedAt = date;
  }

  async beforeUpdate(event: UpdateEvent<Content>): Promise<void> {
    const date = new Date().getTime();
    event.entity.updatedAt = date;
  }
}
