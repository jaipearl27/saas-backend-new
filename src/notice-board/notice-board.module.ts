import { Module } from '@nestjs/common';
import { NoticeBoardController } from './notice-board.controller';
import { NoticeBoardService } from './notice-board.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NoticeBoard } from 'src/schemas/NoticeBoard.schema';
import { NoticeBoardSchema } from 'src/schemas/notice-board.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: NoticeBoard.name,
      schema: NoticeBoardSchema,
    },
  ]),],
  controllers: [NoticeBoardController],
  providers: [NoticeBoardService]
})
export class NoticeBoardModule {}
