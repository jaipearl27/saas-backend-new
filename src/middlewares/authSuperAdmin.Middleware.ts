import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { JwtService } from '@nestjs/jwt';
  import { NextFunction, Response } from 'express';
  
  @Injectable()
  export class AuthSuperAdminMiddleware implements NestMiddleware {
    constructor(
      private readonly configService: ConfigService,
      private readonly jwtService: JwtService,
    ) {}
  
    async use(req /*:  Request */, res: Response, next: NextFunction) {
      console.log('authAdminMiddleware')
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
  
        if (decodedToken && decodedToken.role === this.configService.get('appRoles').SUPER_ADMIN) {
          next();
        } else {
          throw new UnauthorizedException('Unauthorized, Invalid access token.');
        }
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired access token.');
      }
    }
  }
  