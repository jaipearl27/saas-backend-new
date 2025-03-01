import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @Matches(/^\+91\d{10}$/, {
    message: 'Must start with +91 followed by 10 digits'
  })
  @MaxLength(13, {
    message: 'Phone number must be 13 characters including +91'
  })
  secondaryNumber?: string;
}
