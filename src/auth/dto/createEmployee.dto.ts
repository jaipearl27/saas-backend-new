import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

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

    @IsOptional()
    @IsString()
    phone?: string

    @IsString()
    @IsNotEmpty()
    selectedRole: string

}