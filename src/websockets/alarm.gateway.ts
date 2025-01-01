import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  //   ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WebsocketExceptionFilter } from './ws-exception.filter';
import { CreateAlarmDto } from './dto/alarm.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AlarmService } from 'src/alarm/alarm.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseFilters(new WebsocketExceptionFilter())
export class AlarmGateway {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private readonly alarmService: AlarmService,
  ) {}

  private readonly logger = new Logger(AlarmGateway.name);

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('setAlarm')
  @UsePipes(new ValidationPipe())
  async handleAlarm(
    @MessageBody() createAlarmDto: CreateAlarmDto,
    // @ConnectedSocket() client: Socket,
  ): Promise<any> {
    // schedule cron jobs here
    let reminderAlarmDate = new Date(
      new Date(createAlarmDto.date).getTime() - 900 * 1000,
    );

    let alarmDate = new Date(new Date(createAlarmDto.date).getTime());

    const alarmResult = await this.alarmService.saveAlarmInDB(createAlarmDto);
    console.log(alarmResult);

    if (!alarmResult) throw new Error('Alarm not saved in DB');

    //main alarm
    const alarmId = `${alarmResult._id}`;

    // reminder alarm
    if (reminderAlarmDate.getTime() - Date.now() > 0) {
      const reminderId = `reminder-${alarmId}}`;
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
      const deleteResult = await this.alarmService.deleteAlarm(alarmId);

      this.server.emit('playAlarm', {
        message: 'alarm played !!!!!!!!!!!',
        deleteResult,
      });
    });
    this.schedulerRegistry.addCronJob(alarmId, alarm);
    alarm.start();
    // add alarm data in DB

    this.logger.warn(`Alarm ${alarmId} added for ${alarmDate}!`);

    return createAlarmDto;
  }
}
