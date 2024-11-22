import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SidebarLinks } from '../schemas/SidebarLinks.schema';  // Import your SidebarLinks schema
import { CreateSidebarLinkDto, UpdateSidebarLinkDto } from './dto/sidebar-links.dto';

@Injectable()
export class SidebarLinksService {
  constructor(
    @InjectModel(SidebarLinks.name) private sidebarLinksModel: Model<SidebarLinks>,
  ) {}

  async create(createSidebarLinkDto: CreateSidebarLinkDto): Promise<SidebarLinks> {
    const createdSidebarLink = new this.sidebarLinksModel(createSidebarLinkDto);
    return createdSidebarLink.save();
  }

  async findAll(): Promise<SidebarLinks[]> {
    return this.sidebarLinksModel.find().exec();
  }

  async findOne(id: string): Promise<SidebarLinks> {
    return this.sidebarLinksModel.findById(id).exec();
  }

  async update(id: string, updateSidebarLinkDto: UpdateSidebarLinkDto): Promise<any> {
    let result = await this.sidebarLinksModel.findByIdAndUpdate(id, updateSidebarLinkDto, { new: true }).exec();
    return result
  }

  async remove(id: string): Promise<void> {
    await this.sidebarLinksModel.findByIdAndDelete(id).exec();
  }
}
