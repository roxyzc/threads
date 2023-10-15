import { Module } from '@nestjs/common';
import { UserSubscriber } from './user.subscriber';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/app/entities/user.entity';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { Profile } from 'src/app/entities/profile.entity';
import { GdriveModule } from 'src/app/shared/gdrive/gdrive.module';
import { Image } from 'src/app/entities/image.entity';
import { CacheModule } from 'src/app/shared/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Image, Profile]),
    GdriveModule,
    CacheModule,
  ],
  providers: [UserSubscriber, UserService, ProfileService],
  controllers: [ProfileController],
  exports: [UserService],
})
export class UserModule {}
