import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

const prisma = new PrismaClient();

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors(); 
    // Cho FE truy cập thư mục uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',  // URL truy cập file
  });

    // Thay đổi kích thước payload tối đa
    app.use(bodyParser.json({ limit: '10mb' })); // 10MB
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  await app.listen(8080);
}
bootstrap();
