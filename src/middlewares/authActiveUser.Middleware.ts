import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthActiveUserMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) {}

  async use(req /*:  Request */, res: Response, next: NextFunction) {
    if (!req.id) {
      throw new UnauthorizedException('Access token not found.');
    }

    try {
      const user = await this.usersService.getUserById(req?.id);
      if (user.isActive) {
        req.contactLimit = user.contactLimit
        next();
      } else {
        throw new UnauthorizedException('Unauthorized, Invalid access token.');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }y
}
