import { Module } from '@nestjs/common';
import { SidebarLinksController } from './sidebar-links.controller';
import { SidebarLinksService } from './sidebar-links.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SidebarLinks, SidebarLinksSchema } from 'src/schemas/SidebarLinks.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SidebarLinks.name,
        schema: SidebarLinksSchema,
      },
    ]),
  ],
  controllers: [SidebarLinksController],
  providers: [SidebarLinksService]
})
export class SidebarLinksModule {}
