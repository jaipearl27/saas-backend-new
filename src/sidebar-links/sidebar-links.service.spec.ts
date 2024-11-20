import { Test, TestingModule } from '@nestjs/testing';
import { SidebarLinksService } from './sidebar-links.service';

describe('SidebarLinksService', () => {
  let service: SidebarLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SidebarLinksService],
    }).compile();

    service = module.get<SidebarLinksService>(SidebarLinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
