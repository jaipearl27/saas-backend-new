import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Response } from 'express';
import { CustomRequest } from 'src/interface/customRequest.interface';

@Injectable()
export class AuthAdminTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req, res: Response, next: NextFunction) {

    console.log('Middleware applied');  // <-- This will confirm middleware execution
    const access_token =
      req.cookies[this.configService.get('ACCESS_TOKEN_NAME')];

    if (!access_token) {
      throw new UnauthorizedException('Access token not found.');
    }

    try {
      const decodeOptions = {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      };

      const decodedToken = this.jwtService.verify(access_token, decodeOptions);

      if (
        decodedToken &&
        [
          this.configService.get('appRoles').ADMIN,
          this.configService.get('appRoles').SUPER_ADMIN,
        ].includes(decodedToken.role)
      ) {
        req.id = decodedToken.id;
        req.role = decodedToken.role;
        req.plan = decodedToken.plan;
        next();
      } else {
        throw new UnauthorizedException('Unauthorized access token.');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}
