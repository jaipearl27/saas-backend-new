import {
  BadRequestException,
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
       
        next();
      } else {
        throw new BadRequestException('User is Inactive, kindly recharge or contact the administrator.');
      }
    } catch (error) {
      throw error;
    }
  }
}
