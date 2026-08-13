import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service';
import { CurrentUser } from './current-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
};

@ApiTags('Core')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @AllowAnonymous()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get user dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
