/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { auth } from '../auth';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAnonymousAllowed = this.reflector.getAllAndOverride<boolean>(
      'PUBLIC',
      [context.getHandler(), context.getClass()],
    );
    if (isAnonymousAllowed) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      if (!session || !session.user) {
        throw new UnauthorizedException('UNAUTHORIZED');
      }

      // Explicit ban enforcement using dynamic property verification
      const user = session.user as Record<string, unknown>;
      if (user.banned === true) {
        throw new UnauthorizedException('USER_BANNED');
      }

      request.user = session.user;
      request.session = session.session;
      return true;
    } catch {
      throw new UnauthorizedException('UNAUTHORIZED');
    }
  }
}
