import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import path from 'path';

async function bootstrap() {
  const server = await NestFactory.create(AppModule);
  server.use('/static', express.static(path.join(__dirname, '../public')));
  await server.listen(8080);
}

bootstrap();
