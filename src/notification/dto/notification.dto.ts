import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsMongoId } from 'class-validator';
import { notificationActionType, notificationType } from '../../schemas/notification.schema';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsMongoId()
  recipient: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsEnum(notificationType)
  type: notificationType;

  @IsNotEmpty()
  @IsEnum(notificationActionType)
  actionType: notificationActionType;

  @IsOptional()
  @IsBoolean()
  isSeen?: boolean;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
