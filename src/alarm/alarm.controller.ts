import { Body, Controller, Get, NotAcceptableException, Param, Post, Query } from '@nestjs/common';
import { AlarmService } from './alarm.service';
import { Id } from 'src/decorators/custom.decorator';
import { CreateAlarmDto } from './dto/alarm.dto';

@Controller('alarm')
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @Post()
  async setAlarm(
    @Id() id: string,
    @Body() createAlarmDto: CreateAlarmDto,
  ): Promise<any> {
    createAlarmDto.user = id;
    const result = await this.alarmService.setAlarm(createAlarmDto);
    return result;
    
  }

  @Get('')
  async getAttendeeAlarm(
    @Id() id: string,
    @Query() query: {email: string}
  ): Promise<any> {
    if(!query?.email) throw new NotAcceptableException('E-mail not provided in query.')
    const result = await this.alarmService.getAttendeeAlarm(id, query.email)
    return result
  }
}
