import { Module } from '@nestjs/common';
import { UserSubscriber } from './user.subscriber';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/app/entities/user.entity';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { Profile } from 'src/app/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile])],
  providers: [UserSubscriber, UserService, ProfileService],
  controllers: [ProfileController],
  exports: [UserService],
})
export class UserModule {}
