import { Module } from '@nestjs/common';
import { NccService } from './ncc.service';
import { NccController } from './ncc.controller';

@Module({
  controllers: [NccController],
  providers: [NccService],
})
export class NccModule {}
