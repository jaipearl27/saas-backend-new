import { Module } from '@nestjs/common';
import { AlarmGateway } from './alarm.gateway';
import { AlarmModule } from 'src/alarm/alarm.module';

@Module({
    imports: [AlarmModule],
    providers: [AlarmGateway],
})
export class WebsocketsModule {}
