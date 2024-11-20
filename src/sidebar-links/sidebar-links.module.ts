import { Module } from '@nestjs/common';
import { SidebarLinksController } from './sidebar-links.controller';
import { SidebarLinksService } from './sidebar-links.service';

@Module({
  controllers: [SidebarLinksController],
  providers: [SidebarLinksService]
})
export class SidebarLinksModule {}
