

import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Usecase } from 'src/schemas/tags.schema';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEnum(Usecase)
  usecase: string;
}
