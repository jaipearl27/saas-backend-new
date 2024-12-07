import { Module } from '@nestjs/common';
import { FilterPresetService } from './filter-preset.service';
import { FilterPresetController } from './filter-preset.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FilterPreset, FilterPresetSchema } from 'src/schemas/FilterPreset.schema';
import { User, UserSchema } from 'src/schemas/User.schema';

@Module({
  imports: [ MongooseModule.forFeature([
    {
      name: FilterPreset.name,
      schema: FilterPresetSchema,
    },
    {
      name: User.name,
      schema: UserSchema
    }
  ]),],
  providers: [FilterPresetService],
  controllers: [FilterPresetController]
})
export class FilterPresetModule {}
