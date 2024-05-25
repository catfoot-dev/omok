import { Body, Controller, Get, Post, Query, Render } from '@nestjs/common';
import { v4 } from 'uuid';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Render('home')
  @Get()
  home() {
    return {
      uid: v4().replace(/-/g, ''),
    };
  }

  @Post('/history')
  history(
    @Body('uid') uid: string,
    @Body('index') index: number,
  ) {
    console.log({ index });
    return {};
  }

  @Post('/put')
  async putStone(
    @Body('accessCode') accessCode: string,
    @Body('code') code: number,
    @Body('index') index: number,
    @Body('x') x: number,
    @Body('y') y: number,
  ) {
    const [uid, key] = atob(accessCode).split(':');
    return await this.appService.getAIPlacedStone(uid, key, code, index, x, y);
  }
}