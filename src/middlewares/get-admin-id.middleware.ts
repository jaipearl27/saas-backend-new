import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GetAdminIdMiddleware implements NestMiddleware {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req /*:  Request */, res: Response, next: NextFunction) {
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

      req.role = decodedToken.role;
      if (decodedToken.role === this.configService.get('appRoles').ADMIN) {
        req.adminId = new Types.ObjectId(`${decodedToken.id}`); // request type is commented out otherwise typescript won't allow setting this
        req.id = decodedToken.id;
        next();
      } else {
        const user = await this.usersService.getUserById(decodedToken.id);
        req.adminId = user.adminId;
        req.id = decodedToken.id;
        next();
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}
