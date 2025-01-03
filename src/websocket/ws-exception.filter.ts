import { ArgumentsHost, Catch, WsExceptionFilter } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";

@Catch()
export class WebsocketExceptionFilter implements WsExceptionFilter {
    catch(_exception: WsException, host: ArgumentsHost) {
        console.log(_exception)
        const socket = host.switchToWs().getClient();
        socket.emit('exception',  {
            status: 'error',
            message: 'WS message is invalid'
        })
    }
}