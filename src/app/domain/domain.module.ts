import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [AuthModule, UserModule, ContentModule],
})
export class DomainModule {}
