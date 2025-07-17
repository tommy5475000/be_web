import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
// import { SkuModule } from './sku/sku.module';
import { ConfigModule } from '@nestjs/config';
import { NccModule } from './ncc/ncc.module';
import { NhomlvModule } from './nhomlv/nhomlv.module';
// import { Lv1Module } from './lv1/lv1.module';
// import { Lv2Module } from './lv2/lv2.module';
import { InvoiceItModule } from './invoice-it/invoice-it.module';
import {  InvoiveKiotModule } from './ApiKiot/invoive-kiot/invoive-kiot.module';
import {  AuthKiotModule } from './ApiKiot/auth-kiot/auth-kiot.module';

@Module({
  imports: [
    UserModule, 
    AuthModule, 
    NccModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
    NhomlvModule,
    InvoiceItModule,
    InvoiveKiotModule,
    AuthKiotModule,
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
