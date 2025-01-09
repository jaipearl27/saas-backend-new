import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Response } from 'express';

@Injectable()
export class AuthAdminTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req, res: Response, next: NextFunction) {
    // console.log('auth admin Middleware applied', req.cookies); // <-- This will confirm middleware execution
    const access_token =
      req.cookies[this.configService.get('ACCESS_TOKEN_NAME')];

    const pabbly_access_token = this.extractTokenFromHeader(req);

    if (!access_token && !pabbly_access_token) {
      throw new UnauthorizedException('Access token not found.');
    }

    try {
      if (pabbly_access_token) {
        const decodeOptions = {
          secret: this.configService.get('PABBLY_CLIENT_ACCESS_TOKEN_SECRET'),
        };

        const decodedToken = this.jwtService.verify(
          pabbly_access_token,
          decodeOptions,
        );

        if (
          decodedToken &&
          decodedToken.role === this.configService.get('appRoles').ADMIN
        ) {
          req.id = decodedToken.id;
          req.role = decodedToken.role;
          req.plan = decodedToken.plan;
          next();
        } else {
          throw new UnauthorizedException(
            'Unauthorized, Invalid Pabbly access token.',
          );
        }
      } else if (access_token) {
        console.log('admin token')
        const decodeOptions = {
          secret: this.configService.get('ACCESS_TOKEN_SECRET'),
        };

        const decodedToken = this.jwtService.verify(
          access_token,
          decodeOptions,
        );

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
      }
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  private extractTokenFromHeader(req): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
