import { IsNotEmpty, IsString } from 'class-validator';

export class AlarmMsgDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  note: string;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  attendeeEmail: string;
}


export class ReminderMsgDto {
    @IsString()
    @IsNotEmpty()
    phone: string;
  
    @IsString()
    @IsNotEmpty()
    note: string;
  
    @IsString()
    @IsNotEmpty()
    userName: string;
  
    @IsString()
    @IsNotEmpty()
    attendeeEmail: string;
  }
  
