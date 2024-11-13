import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  email: string;

  @IsEnum(['Super Admin', 'Admin', 'Sales Employee', 'Reminder Employee'], {
    message: 'Valid role required.',
  })
  role: 'Super Admin' | 'Admin' | 'Sales Employee' | 'Reminder Employee';
}
