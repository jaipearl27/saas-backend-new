import { Body, Controller, Get, NotAcceptableException, Param, Patch, Post, Query } from '@nestjs/common';
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

  @Get()
  async getAttendeeAlarm(
    @Id() id: string,
    @Query() query: {email: string}
  ): Promise<any> {
    if(!query?.email) throw new NotAcceptableException('E-mail not provided in query.')
    const result = await this.alarmService.getAttendeeAlarm(id, query.email)
    return result
  }

  @Get('user/:id')
  async getUserAlarms(@Param('id') id: string): Promise<any> {
    console.log(id);
    return await this.alarmService.fetchAlarmsByMonthAndYear(id,1, 2025);
  }

  
  @Patch()
  async cancelAlarm(
    @Id() id: string,
    @Body('id') alarmId: string ,
  ): Promise<any> {
    const result = await this.alarmService.cancelAlarm(alarmId, id);
    return result;
    
  }
}
