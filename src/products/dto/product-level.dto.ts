import { IsString, IsNotEmpty, IsMongoId, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateProductLevelDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  level: number;
}

export class UpdateProductLevelDto {
  @IsString()
  @IsOptional()
  label?: string;

//   @IsNumber()
//   @Min(0)
//   @IsOptional()
//   level?: number;
}
