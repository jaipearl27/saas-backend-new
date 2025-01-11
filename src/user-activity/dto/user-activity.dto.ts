import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserActivityDto {
  @IsNotEmpty()
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  details?: string;
}

export class InactiviUserDTO {
  @IsNotEmpty()
  @IsString()
  userName: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsMongoId()
  userId: string;
}
