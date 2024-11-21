import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SidebarLinksService } from './sidebar-links.service';
import { CreateSidebarLinkDto, UpdateSidebarLinkDto } from './dto/sidebar-links.dto';
import { SidebarLinks } from '../schemas/SidebarLinks.schema';  // Import the SidebarLinks schema

@Controller('sidebar-links')
export class SidebarLinksController {
  constructor(private readonly sidebarLinksService: SidebarLinksService) {}

  @Post()
  async create(@Body() createSidebarLinkDto: CreateSidebarLinkDto): Promise<SidebarLinks> {
    return this.sidebarLinksService.create(createSidebarLinkDto);
  }

  @Get()
  async findAll(): Promise<SidebarLinks[]> {
    return this.sidebarLinksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SidebarLinks> {
    return this.sidebarLinksService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSidebarLinkDto: UpdateSidebarLinkDto,
  ): Promise<SidebarLinks> {
    return this.sidebarLinksService.update(id, updateSidebarLinkDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.sidebarLinksService.remove(id);
  }
}
