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
  
  // Extend Request interface to include adminId
  declare module 'express' {
    interface Request {
      adminId?: Types.ObjectId;
      id?:string;
      role?: string;
    }
  }
  
  @Injectable()
  export class GetAdminIdForUserActivityMiddleware implements NestMiddleware {
    constructor(
      private readonly usersService: UsersService,
      private readonly configService: ConfigService,
      private readonly jwtService: JwtService,
    ) {}
  
    async use(req: Request, res: Response, next: NextFunction) {
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
        if(!decodedToken)
            throw new UnauthorizedException('Unauthorized, Invalid access token.');
  
        const user = await this.usersService.getUserById(decodedToken.id);
  
        if (!user) {
          throw new UnauthorizedException('User not found.');
        }
  
        if (!user.adminId) {
          throw new UnauthorizedException('Admin ID not found for user.');
        }
  
        req.adminId = user.adminId;
        req.id = decodedToken.id;
        req.role = decodedToken.role;
  
        next();
      } catch (error) {
        throw new UnauthorizedException(
          error.message || 'Invalid or expired access token.',
        );
      }
    }
  }
  