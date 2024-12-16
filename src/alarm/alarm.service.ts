import { Body, Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Id } from 'src/decorators/custom.decorator';
import { CreateAlarmDto } from './dto/alarm.dto';
import { CronJob } from 'cron';

@Injectable()
export class AlarmService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  private readonly logger = new Logger(AlarmService.name);

  async setAlarm(id: string, createAlarmDto: CreateAlarmDto): Promise<any> {
    //perform check here

    // schedule cron jobs here
    let reminderAlarmDate = new Date(
      new Date(createAlarmDto.date).getTime() - 900 * 1000,
    );

    let alarmDate = new Date(new Date(createAlarmDto.date).getTime());

    // reminder alarm

    if (reminderAlarmDate.getTime() - Date.now() > 0) {
      const reminderId = `reminder-${id}-${Date.now()}`;
      const reminderAlarm = new CronJob(reminderAlarmDate, () => {
        this.logger.warn(
          `reminder for the alarm was set (${Date.now()}) for job ${reminderId} to run!`,
        );
      });

      this.schedulerRegistry.addCronJob(reminderId, reminderAlarm);
      reminderAlarm.start();

      this.logger.warn(`Alarm ${reminderId} added for ${reminderAlarmDate}!`);
    }

    //main alarm
    const alarmId = `alarm-${id}-${Date.now()}`;

    const alarm = new CronJob(alarmDate, () => {
      this.logger.warn(`time (${Date.now()}) for job ${alarmId} to run!`);
    });
    this.schedulerRegistry.addCronJob(alarmId, alarm);
    alarm.start();
    // add alarm data in DB

    this.logger.warn(`Alarm ${alarmId} added for ${alarmDate}!`);
  }
}
