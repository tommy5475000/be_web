import { Module } from '@nestjs/common';
import { NhomlvService } from './nhomlv.service';
import { NhomlvController } from './nhomlv.controller';

@Module({
  controllers: [NhomlvController],
  providers: [NhomlvService],
})
export class NhomlvModule {}
