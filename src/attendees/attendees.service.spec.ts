import { Test, TestingModule } from '@nestjs/testing';
import { AttendeesService } from './attendees.service';

describe('AttendeesService', () => {
  let service: AttendeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendeesService],
    }).compile();

    service = module.get<AttendeesService>(AttendeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
