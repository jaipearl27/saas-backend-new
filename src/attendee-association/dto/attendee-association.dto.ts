import { IsEmail, IsMongoId, IsNotEmpty, IsOptional } from "class-validator";
import { Types } from "mongoose";

export class AttendeeAssociationDto {
    @IsNotEmpty({ message: 'Lead type is required' })
    @IsMongoId({ message: 'Lead type must be a valid MongoId' })
    leadType:  Types.ObjectId ;

    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    email: string;

}