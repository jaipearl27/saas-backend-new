import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Roles, RolesSchema } from 'src/schemas/Roles.schema';

@Module({
  imports: [ MongooseModule.forFeature([
    {
      name: Roles.name,
      schema: RolesSchema,
    }
  ]),],
  controllers: [RolesController],
  providers: [RolesService]
})
export class RolesModule {}
