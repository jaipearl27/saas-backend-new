import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class User {
  @Prop({ required: true })
  userName: string

  @Prop({required: true})
  password: string

  @Prop({
    required: true,
    enums: ['Super Admin', 'Admin', 'Sales Employee', 'Reminder Employee'],
  })
  role: 'Super Admin' | 'Admin' | 'Sales Employee' | 'Reminder Employee';
}

export const UserSchema = SchemaFactory.createForClass(User);
