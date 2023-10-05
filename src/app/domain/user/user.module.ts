import { Module } from '@nestjs/common';
import { UserSubscriber } from './user.subscriber';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/app/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserSubscriber, UserService],
  exports: [UserService],
})
export class UserModule {}
