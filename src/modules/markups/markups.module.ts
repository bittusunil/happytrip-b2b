import { Module } from '@nestjs/common';
import { MarkupsService } from './markups.service';
import { MarkupsController } from './markups.controller';

@Module({
  controllers: [MarkupsController],
  providers: [MarkupsService],
  exports: [MarkupsService],
})
export class MarkupsModule {}
