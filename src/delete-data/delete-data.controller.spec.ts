import { Test, TestingModule } from '@nestjs/testing';
import { DeleteDataController } from './delete-data.controller';

describe('DeleteDataController', () => {
  let controller: DeleteDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeleteDataController],
    }).compile();

    controller = module.get<DeleteDataController>(DeleteDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
