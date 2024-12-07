import { IsString, IsNotEmpty, IsObject, IsMongoId } from 'class-validator';

export class CreateFilterPresetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // @IsMongoId()
  // @IsNotEmpty()
  // userId: string;

  @IsString()
  @IsNotEmpty()
  tableName: string;

  @IsObject()
  @IsNotEmpty()
  filters: Map<string, any>;
}
