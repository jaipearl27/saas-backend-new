import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAlarmDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  user?: string;

  @IsString()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  attendeeId: string

  @IsString()
  @IsNotEmpty()
  date: Date;

  @IsOptional()
  @IsString()
  note?: string;
}
