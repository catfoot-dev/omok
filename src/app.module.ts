import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '@nestjs/common';
import Next from 'next';
import { RenderModule } from 'nest-next';

@Module({
  imports: [
    RenderModule.forRootAsync(
      Next({
        dev: process.env.NODE_ENV !== 'production',
        conf: { useFilesystemPublicRoutes: false },
      }),
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}