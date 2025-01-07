import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CreateAlarmDto } from './dto/alarm.dto';
import { CronJob } from 'cron';
import { InjectModel } from '@nestjs/mongoose';
import { Alarm } from 'src/schemas/Alarm.schema';
import { Model, Types } from 'mongoose';
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

  async setAlarm(
    createAlarmDto: CreateAlarmDto,
    id?: string,
    startup?: boolean,
  ): Promise<any> {
    //perform check here

    const alarmExists = await this.getAttendeeAlarm(
      createAlarmDto.user,
      createAlarmDto.email,
    );

    if (alarmExists && !startup)
      throw new NotAcceptableException(
        'Alarm for this attendee already exists.',
      );

    let reminderAlarmDate = new Date(
      new Date(createAlarmDto.date).getTime() - 900 * 1000,
    );
    let alarmDate = new Date(new Date(createAlarmDto.date).getTime());

    if (alarmDate.getTime() - Date.now() <= 0 && !startup)
      throw new NotAcceptableException('Cannot set alarm for time in past.');

    if (!id) {
      const alarmData = await this.saveAlarmInDB(createAlarmDto);
      id = alarmData._id;
    }

    console.log('id in db', id);

    // reminder alarm
    if (reminderAlarmDate.getTime() - Date.now() > 0) {
      const reminderId = `reminder-${id}`; //format: reminder-{alarm _id from MongoDB}
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
        message: '!!! Alarm played !!!',
        deleteResult,
      });
    });


    const alarmId = `alarm-${id}`

    this.schedulerRegistry.addCronJob(alarmId, alarm); //id === alarm document ID in DB
    alarm.start();
    // add alarm data in DB

    this.logger.warn(`Alarm ${alarmId} added for ${alarmDate}!`);
    return 'Alarm set.';
  }

  async saveAlarmInDB(createAlarmDto: CreateAlarmDto): Promise<any> {
    const alarm = await this.alarmsModel.create(createAlarmDto);
    return alarm;
  }

  async deleteAlarm(id: string): Promise<any> {
    const alarm = await this.alarmsModel.findByIdAndDelete(id);
    return alarm;
  }

  async getAttendeeAlarm(user: string, email: string) {
    const alarm = await this.alarmsModel.findOne({
      user: new Types.ObjectId(`${user}`),
      email: email,
    });
    return alarm;
  }

  async cancelAlarm(alarmId: string, id: string): Promise<any> {
    
    const alarmData = await this.alarmsModel.findById(alarmId);
    console.log(alarmId, alarmData)

    if (alarmData) {
      const reminderAlarm = this.schedulerRegistry.getCronJob(
        `reminder-${alarmId}`,
      );
      if (reminderAlarm) {
        reminderAlarm.stop();
        console.log('====reminder alarm stopped===');
      }

      const alarm = this.schedulerRegistry.getCronJob(`alarm-${alarmId}`);
      if (alarm) {
        alarm.stop();
        console.log('====alarm stopped===');
      }
    }
    const deleteAlarm = await this.alarmsModel.findOneAndDelete({
      _id: new Types.ObjectId(`${alarmId}`),
      user: new Types.ObjectId(`${id}`),
    });

    return deleteAlarm;
  }

  async onModuleInit(): Promise<void> {
    console.log("===================I'm running bitches===================");
    const alarms: any[] = await this.alarmsModel.find({});

    if (Array.isArray(alarms) && alarms.length > 0) {
      alarms.forEach(async (alarm) => {
        const createAlarmDto: CreateAlarmDto = {
          user: alarm.user,
          email: alarm?.email,
          date: alarm.date,
          note: alarm.note,
        };
        await this.setAlarm(createAlarmDto, alarm?._id, true);
      });
    }
  }

  async fetchAlarmsByMonthAndYear(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const alarms = await this.alarmsModel
      .find({
        user: new Types.ObjectId(`${userId}`),
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      })
      .select('date email note _id')
      .exec();

    return alarms;
  }
}
