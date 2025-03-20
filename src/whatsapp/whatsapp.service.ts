import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  NotAcceptableException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import { AlarmMsgDto, ReminderMsgDto } from './dto/msg.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  url = this.configService.get('AISENSY_URL');
  superAdmin: null | {
    companyName: string;
    email: string;
    address: string;
  } = null;
  onModuleInit() {
    this.usersService.getSuperAdminDetails(true).then((superAdmin) => {
      console.log('superAdmin -------- >', superAdmin);
      this.superAdmin = superAdmin;
    });
  }

  private isValidPhoneNumber(phoneNumber: string) {
    // Define the regex pattern for validation
    const phoneRegex = /^\+\d{1,3}\d{9}$/;

    // Test the phone number against the regex
    return phoneRegex.test(phoneNumber);
  }

  async sendAlarmMsg(alarmMsgDto: AlarmMsgDto) {
    if (!this.isValidPhoneNumber(alarmMsgDto.phone)) return;

    try {
      const bodyData = {
        apiKey: this.configService.get('AISENSY_KEY'),
        campaignName: this.configService.get('ALARM_CAMPAIGN'),
        destination: alarmMsgDto.phone,
        userName: alarmMsgDto.userName,
        templateParams: [
          alarmMsgDto.userName,
          alarmMsgDto.attendeeEmail,
          alarmMsgDto.note,
        ],
      };
      const result = await lastValueFrom(
        this.httpService
          .post(this.url, bodyData)
          .pipe(map((resp) => resp.data)),
      );
      return result;
    } catch (error) {
      console.error('Failed to send alarm message:', error.message);
      return { error: error.message };
    }
  }

  async sendReminderMsg(reminderMsgDto: ReminderMsgDto) {
    if (!this.isValidPhoneNumber(reminderMsgDto.phone)) return;

    try {
      const bodyData = {
        apiKey: this.configService.get('AISENSY_KEY'),
        campaignName: this.configService.get('REMINDER_CAMPAIGN'),
        destination: reminderMsgDto.phone,
        userName: reminderMsgDto.userName,
        templateParams: [
          reminderMsgDto.userName,
          reminderMsgDto.attendeeEmail,
          reminderMsgDto.note,
        ],
      };
      const result = await lastValueFrom(
        this.httpService
          .post(this.url, bodyData)
          .pipe(map((resp) => resp.data)),
      );
      return result;
    } catch (error) {
      console.error('Failed to send reminder message:', error.message);
      return { error: error.message };
    }
  }
}
