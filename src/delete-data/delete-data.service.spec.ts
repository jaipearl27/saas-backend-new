import { Test, TestingModule } from '@nestjs/testing';
import { DeleteDataService } from './delete-data.service';

describe('DeleteDataService', () => {
  let service: DeleteDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteDataService],
    }).compile();

    service = module.get<DeleteDataService>(DeleteDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
