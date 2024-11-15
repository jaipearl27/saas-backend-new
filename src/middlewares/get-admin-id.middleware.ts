import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GetAdminIdMiddleware implements NestMiddleware {

  constructor(private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ){}

  use(req: Request, res: Response, next: NextFunction) {
    const access_token = req.cookies[this.configService.get('ACCESS_TOKEN_NAME')]

    if(!access_token) {
      throw new UnauthorizedException('Access token not found.')
    }

    try {
      const decodeOptions = {
        secret: this.configService.get('ACCESS_TOKEN_SECRET')
      }
  
      const decodedToken = this.jwtService.verify(access_token , decodeOptions)
  
      console.log(decodedToken) 
      next();  
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token.')
    }
  }
}
