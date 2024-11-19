import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateEmployeeDto {
    @IsString()
    @IsNotEmpty()
    userName: string

    @IsString()
    @IsNotEmpty()
    password: string

    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsString()
    phone?: string

    @IsString()
    @IsNotEmpty()
    adminId: string

    @IsString()
    @IsNotEmpty()
    selectedRole: string


}