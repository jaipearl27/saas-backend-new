import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CreateAlarmDto } from './dto/alarm.dto';
import { CronJob } from 'cron';
import { InjectModel } from '@nestjs/mongoose';
import { Alarm } from 'src/schemas/Alarm.schema';
import { Model } from 'mongoose';

@Injectable()
export class AlarmService {
  constructor(
    @InjectModel(Alarm.name) private readonly alarmsModel: Model<Alarm>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  private readonly logger = new Logger(AlarmService.name);

  async setBulkAlarm(id: string, date: string): Promise<any> {
    //perform check here

    let reminderAlarmDate = new Date(new Date(date).getTime() - 900 * 1000);
    let alarmDate = new Date(new Date(date).getTime());

    // reminder alarm
    if (reminderAlarmDate.getTime() - Date.now() > 0) {
      const reminderId = `reminder-${id}}`;
      const reminderAlarm = new CronJob(reminderAlarmDate, () => {
        this.logger.warn(
          `reminder for the alarm was set (${Date.now()}) for job ${reminderId} to run!`,
        );
      });

      this.schedulerRegistry.addCronJob(reminderId, reminderAlarm);
      reminderAlarm.start();

      this.logger.warn(`Alarm ${reminderId} added for ${reminderAlarmDate}!`);
    }

    const alarm = new CronJob(alarmDate, async () => {
      const deleteResult = await this.deleteAlarm(id);

      // this.server.emit('playAlarm', {
      //   message: 'alarm played !!!!!!!!!!!',
      //   deleteResult,
      // });
    });
    this.schedulerRegistry.addCronJob(id, alarm);
    alarm.start();
    // add alarm data in DB

    this.logger.warn(`Alarm ${id} added for ${alarmDate}!`);
  }

  async saveAlarmInDB(createAlarmDto: CreateAlarmDto): Promise<any> {
    const alarm = await this.alarmsModel.create(createAlarmDto);
    return alarm;
  }

  async deleteAlarm(id: string): Promise<any> {
    const alarm = await this.alarmsModel.findByIdAndDelete(id);
    return alarm;
  }

  async onModuleInit(): Promise<void> {
    const alarms: any[] = await this.alarmsModel.find({});

    if (Array.isArray(alarms) && alarms.length > 0) {
      alarms.forEach(async (alarm) => {
        await this.setBulkAlarm(alarm?._id, alarm);
      });
    }
  }
}
