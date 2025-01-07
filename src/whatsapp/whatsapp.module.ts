import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
