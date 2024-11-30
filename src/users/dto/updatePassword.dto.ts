import { IsNotEmpty, IsString } from "class-validator";

export class UpdatePasswordDto {
    @IsString()
    @IsNotEmpty()
    password: string

    @IsString()
    @IsNotEmpty()
    confirmPassword: string

    @IsString()
    @IsNotEmpty()
    oldPassword: string
}