import { Module } from '@nestjs/common';
import { AuthKiotService } from './auth-kiot.service';
import { AuthKiotController } from './auth-kiot.controller';

@Module({
  controllers: [AuthKiotController],
  providers: [AuthKiotService],
  exports: [AuthKiotService],
})
export class AuthKiotModule {}
