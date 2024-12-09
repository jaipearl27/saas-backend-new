import { Controller, Get, Post, Body, Put } from '@nestjs/common';
import { NoticeBoardService } from './notice-board.service';
import { NoticeBoard } from '../schemas/notice-board.schema';

@Controller('notice-board')
export class NoticeBoardController {
  constructor(private readonly noticeBoardService: NoticeBoardService) {}

  @Get()
  async getNoticeBoard(): Promise<NoticeBoard> {
    return this.noticeBoardService.find();
  }

  @Post()
async createOrUpdateNoticeBoard(
  @Body('content') content: string,
  @Body('type') type: string,
): Promise<NoticeBoard> {
  return this.noticeBoardService.createOrUpdate(content, type);
}
}
