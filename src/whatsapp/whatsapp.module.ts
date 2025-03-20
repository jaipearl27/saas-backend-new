import { forwardRef, Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [HttpModule, forwardRef(() => UsersModule)],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
