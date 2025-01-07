import { HttpService } from '@nestjs/axios';
import { Injectable, NotAcceptableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import { AlarmMsgDto, ReminderMsgDto } from './dto/msg.dto';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  url = this.configService.get('AISENSY_URL');

  private isValidPhoneNumber(phoneNumber: string) {
    // Define the regex pattern for validation
    const phoneRegex = /^\+\d{1,3}\d{9}$/;

    // Test the phone number against the regex
    return phoneRegex.test(phoneNumber);
  }

  async sendAlarmMsg(alarmMsgDto: AlarmMsgDto) {
    if(!this.isValidPhoneNumber(alarmMsgDto.phone)) return

    const bodyData = {
      apiKey: this.configService.get('AISENSY_KEY'),
      campaignName: this.configService.get('ALARM_CAMPAIGN'),
      destination: alarmMsgDto.phone,
      userName: alarmMsgDto.userName,
      templateParams: [alarmMsgDto.userName, alarmMsgDto.attendeeEmail, alarmMsgDto.note],
    };
    const result = await lastValueFrom(
      this.httpService.post(this.url, bodyData).pipe(map((resp) => resp.data)),
    );

    return result;
  }

  async sendReminderMsg(reminderMsgDto: ReminderMsgDto) {
    if(!this.isValidPhoneNumber(reminderMsgDto.phone)) return

    const bodyData = {
      apiKey: this.configService.get('AISENSY_KEY'),
      campaignName: this.configService.get('REMINDER_CAMPAIGN'),
      destination: reminderMsgDto.phone,
      userName: reminderMsgDto.userName,
      templateParams: [reminderMsgDto.userName, reminderMsgDto.attendeeEmail, reminderMsgDto.note],
    };
    const result = await lastValueFrom(
      this.httpService.post(this.url, bodyData).pipe(map((resp) => resp.data)),
    );

    return result;
  }

}
