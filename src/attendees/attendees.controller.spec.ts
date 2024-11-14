import { Test, TestingModule } from '@nestjs/testing';
import { AttendeesController } from './attendees.controller';

describe('AttendeesController', () => {
  let controller: AttendeesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendeesController],
    }).compile();

    controller = module.get<AttendeesController>(AttendeesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
