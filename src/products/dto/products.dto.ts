import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  adminId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  webinar: string;

  @IsString()
  @IsNotEmpty()
  description: string; //description

  @IsNumber()
  @IsNotEmpty()
  level: 1 | 2 | 3;
}

export class UpdateProductsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  price?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  webinar?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string; //description

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  level?: 1 | 2 | 3;
}
