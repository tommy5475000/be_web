import { Module } from '@nestjs/common';
import { InvoiveKiotService } from './invoive-kiot.service';
import { InvoiveKiotController } from './invoive-kiot.controller';
import {AuthKiotModule} from './../auth-kiot/auth-kiot.module'

@Module({
  controllers: [InvoiveKiotController],
  providers: [InvoiveKiotService],
  imports:[AuthKiotModule]
})
export class InvoiveKiotModule {}
