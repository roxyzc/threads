import { Module } from '@nestjs/common';
import { GdriveService } from './gdrive.service';

@Module({
  providers: [GdriveService],
  exports: [GdriveService],
})
export class GdriveModule {}
