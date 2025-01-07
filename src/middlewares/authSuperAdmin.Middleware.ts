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
    const access_token =
      req.cookies[this.configService.get('ACCESS_TOKEN_NAME')];
    const pabbly_access_token = this.extractTokenFromHeader(req);

    if (!access_token && !pabbly_access_token) {
      throw new UnauthorizedException('Access token not found.');
    }

    try {
      if (pabbly_access_token) {
        console.log('super admin pabbly access token');
        const decodeOptions = {
          secret: this.configService.get('PABBLY_ACCESS_TOKEN_SECRET'),
        };

        const decodedToken = this.jwtService.verify(
          pabbly_access_token,
          decodeOptions,
        );

        if (
          decodedToken &&
          decodedToken.role === this.configService.get('appRoles').SUPER_ADMIN
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
        console.log('super admin access token');
        const decodeOptions = {
          secret: this.configService.get('ACCESS_TOKEN_SECRET'),
        };

        const decodedToken = this.jwtService.verify(
          access_token,
          decodeOptions,
        );

        if (
          decodedToken &&
          decodedToken.role === this.configService.get('appRoles').SUPER_ADMIN
        ) {
          req.id = decodedToken.id;
          req.role = decodedToken.role;
          req.plan = decodedToken.plan;
          next();
        } else {
          throw new UnauthorizedException(
            'Unauthorized, Invalid accesss token.',
          );
        }
      }
    } catch (error) {
      // console.log(error);
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  private extractTokenFromHeader(req): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
