import { IsNotEmpty, IsString } from "class-validator";

export class CreateWebinarDto {
    @IsString()
    @IsNotEmpty()
    webinarName: string; // Webinar Name
    
    @IsString()
    @IsNotEmpty()
    webinarDate: string; // Webinar Date
  
    @IsString()
    @IsNotEmpty()
    adminId: string;
}