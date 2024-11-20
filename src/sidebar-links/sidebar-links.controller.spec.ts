import { Test, TestingModule } from '@nestjs/testing';
import { SidebarLinksController } from './sidebar-links.controller';

describe('SidebarLinksController', () => {
  let controller: SidebarLinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SidebarLinksController],
    }).compile();

    controller = module.get<SidebarLinksController>(SidebarLinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
