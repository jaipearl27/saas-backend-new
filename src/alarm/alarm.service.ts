import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CreateAlarmDto } from './dto/alarm.dto';
import { CronJob } from 'cron';
import { InjectModel } from '@nestjs/mongoose';
import { Alarm } from 'src/schemas/Alarm.schema';
import { Model } from 'mongoose';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
@Injectable()
export class AlarmService {
  constructor(
    @InjectModel(Alarm.name) private readonly alarmsModel: Model<Alarm>,
    private schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => WebsocketGateway)) // Lazy inject AlarmGateway
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  private readonly logger = new Logger(AlarmService.name);

  async setAlarm(createAlarmDto: CreateAlarmDto, id?: string): Promise<any> {
    //perform check here

    let reminderAlarmDate = new Date(
      new Date(createAlarmDto.date).getTime() - 900 * 1000,
    );
    let alarmDate = new Date(new Date(createAlarmDto.date).getTime());

    if (!id) {
      const alarmData = await this.saveAlarmInDB(createAlarmDto);
      id = alarmData._id;
    }

    console.log('id in db', id);

    // reminder alarm
    if (reminderAlarmDate.getTime() - Date.now() > 0) {
      const reminderId = `reminder${Date.now()}-${createAlarmDto.user}-${id}}`;
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
      const socketId = this.websocketGateway.activeUsers.get(
        createAlarmDto.user,
      );
      this.websocketGateway.server.to(socketId).emit('playAlarm', {
        message: '!!!!!!!!!!! Alarm played !!!!!!!!!!!',
        deleteResult,
      });
    });
    this.schedulerRegistry.addCronJob(id, alarm);
    alarm.start();
    // add alarm data in DB

    this.logger.warn(`Alarm ${createAlarmDto.user} added for ${alarmDate}!`);
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
    console.log("===================I'm running bitches===================");
    const alarms: any[] = await this.alarmsModel.find({});

    if (Array.isArray(alarms) && alarms.length > 0) {
      alarms.forEach(async (alarm) => {
        const createAlarmDto: CreateAlarmDto = {
          user: alarm.user,
          date: alarm.date,
          note: alarm.note,
        };
        await this.setAlarm(createAlarmDto, alarm?._id);
      });
    }
  }
}
