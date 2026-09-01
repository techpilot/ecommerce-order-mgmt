import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from './jwt-access.strategy';

export interface AuthenticatedRefreshUser {
  userId: string;
  email: string;
  refreshToken: string;
}

function extractFromCookie(req: Request): string | null {
  return req?.cookies?.['refreshToken'] ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): AuthenticatedRefreshUser {
    const refreshToken = extractFromCookie(req) as string;
    return { userId: payload.sub, email: payload.email, refreshToken };
  }
}
