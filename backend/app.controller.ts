import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service';
import { CurrentUser } from './current-user.decorator';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @AllowAnonymous()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: unknown) {
    if (!user || typeof user !== 'object') {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    const candidate = user as Partial<AuthenticatedUser>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.name !== 'string'
    ) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    return {
      message: `Welcome to the dashboard, ${candidate.name}!`,
      user: {
        id: candidate.id,
        name: candidate.name,
        ...(typeof candidate.email === 'string'
          ? { email: candidate.email }
          : {}),
        ...(typeof candidate.image === 'string'
          ? { image: candidate.image }
          : {}),
      },
    };
  }
}
