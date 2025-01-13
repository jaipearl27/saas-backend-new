import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateLocationDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsBoolean()
    @IsNotEmpty()
    isVerified: boolean

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    admin?: string
}



export class UpdateLocationDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string

    @IsOptional()
    @IsBoolean()
    @IsNotEmpty()
    isVerified?: boolean
}