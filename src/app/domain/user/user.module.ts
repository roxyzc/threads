import { Module } from '@nestjs/common';
import { UserSubscriber } from './user.subscriber';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/app/entities/user.entity';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { Profile } from 'src/app/entities/profile.entity';
import { GdriveModule } from 'src/app/shared/gdrive/gdrive.module';
import { ImageProfile } from 'src/app/entities/imageProfile.entity';
import { CacheModule } from 'src/app/shared/cache/cache.module';
import { Followship } from 'src/app/entities/followship.entity';
import { FollowshipController } from './controllers/followership.controller';
import { FollowshipService } from './services/followership.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ImageProfile, Profile, Followship]),
    GdriveModule,
    CacheModule,
  ],
  providers: [UserSubscriber, UserService, ProfileService, FollowshipService],
  controllers: [ProfileController, FollowshipController],
  exports: [UserService],
})
export class UserModule {}
