import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NoticeBoard } from '../schemas/notice-board.schema';

@Injectable()
export class NoticeBoardService {
  constructor(
    @InjectModel(NoticeBoard.name) private noticeBoardModel: Model<NoticeBoard>,
  ) {}

  // Create or Update the notice board
  async createOrUpdate(content: string, type: string): Promise<NoticeBoard> {
    // Try to find a notice by type
    let notice = await this.noticeBoardModel.findOne({ type }).exec();
  
    if (notice) {
      // If notice exists, update it
      notice.content = content;
      return await notice.save();
    } else {
      // If no notice exists, create a new one
      notice = new this.noticeBoardModel({ content, type });
      return await notice.save();
    }
  }
  

  // Get the current notice board content
  async find(): Promise<NoticeBoard> {
    const notice = await this.noticeBoardModel.findOne().exec();

    if (!notice) {
      throw new NotFoundException('Notice board not found');
    }

    return notice;
  }
}
