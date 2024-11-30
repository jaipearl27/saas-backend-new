import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserActivityDto {
  @IsNotEmpty()
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  details?: string;
}
