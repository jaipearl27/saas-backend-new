import { IsNotEmpty, IsString } from "class-validator";

export class CreatorDetailsDto {
    @IsString()
    @IsNotEmpty()
    id: string

    @IsString()
    @IsNotEmpty()
    role: string

    @IsString()
    @IsNotEmpty()
    plan: string
}