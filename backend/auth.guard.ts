import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth';

type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: unknown;
  session?: unknown;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAnonymousAllowed = this.reflector.getAllAndOverride<boolean>(
      'PUBLIC',
      [context.getHandler(), context.getClass()],
    );
    if (isAnonymousAllowed) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      const user = session?.user;
      const isBanned =
        typeof user === 'object' &&
        user !== null &&
        (user as { banned?: unknown }).banned === true;

      if (!user || isBanned) {
        throw new UnauthorizedException('UNAUTHORIZED');
      }

      request.user = user;
      request.session = session.session;
      return true;
    } catch {
      throw new UnauthorizedException('UNAUTHORIZED');
    }
  }
}
