import { Module } from '@nestjs/common';
import { WebinarService } from './webinar.service';
import { WebinarController } from './webinar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Webinar, WebinarSchema } from 'src/schemas/Webinar.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Webinar.name,
        schema: WebinarSchema
      }
    ])
  ],
  providers: [WebinarService],
  controllers: [WebinarController]
})
export class WebinarModule {}

