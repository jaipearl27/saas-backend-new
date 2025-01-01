import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAlarmDto {
  @IsString()
  @IsNotEmpty()
  user: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  date: Date;

  @IsOptional()
  @IsString()
  note?: string;
}
