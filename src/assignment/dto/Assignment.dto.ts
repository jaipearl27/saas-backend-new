import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class AssignmentDto {

    @IsString()
    @IsNotEmpty()
    adminId: string

    @IsString()
    @IsNotEmpty()
    user: string

    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsString()
    @IsNotEmpty()
    recordType: 'preWebinar' | 'postWebinar'
}