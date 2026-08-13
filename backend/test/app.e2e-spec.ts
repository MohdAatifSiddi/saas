/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

// Mock the @thallesp/nestjs-better-auth module to bypass ESM compilation and database dependencies during tests
jest.mock('@thallesp/nestjs-better-auth', () => {
  const { APP_GUARD } = require('@nestjs/core');
  const {
    createParamDecorator,
    SetMetadata,
    UnauthorizedException,
  } = require('@nestjs/common');
  return {
    AuthModule: {
      forRoot: () => ({
        module: class MockAuthModule {},
        providers: [
          {
            provide: APP_GUARD,
            useValue: {
              canActivate: (context: any) => {
                const request = context.switchToHttp().getRequest();
                if (request.path === '/') return true;
                const token = request.headers.authorization;
                if (token?.trim() === 'Bearer mock-token') {
                  request.user = {
                    id: '1',
                    name: 'Test User',
                    email: 'test@example.com',
                  };
                  return true;
                }
                if (token === 'Bearer banned-token') {
                  throw new UnauthorizedException();
                }
                throw new UnauthorizedException();
              },
            },
          },
        ],
        exports: [],
      }),
    },
    Session: () =>
      createParamDecorator((_data: unknown, context: any) => {
        const request = context.switchToHttp().getRequest();
        if (request.headers.authorization?.trim() === 'Bearer mock-token') {
          return {
            user: { id: '1', name: 'Test User', email: 'test@example.com' },
          };
        }
        return undefined;
      }),
    AllowAnonymous: () => SetMetadata('better-auth:allow-anonymous', true),
    OptionalAuth: () => () => {},
  };
});

// Mock the backend auth config to avoid importing better-auth and transitive ESM dependencies like @noble/hashes during testing
jest.mock('../src/auth/auth', () => {
  return {
    auth: {
      api: {
        getSession: jest.fn().mockImplementation(async ({ headers }) => {
          if (headers.authorization === 'Bearer mock-token') {
            return {
              user: { id: '1', name: 'Test User', role: 'user', banned: false },
              session: {},
            };
          }
          if (headers.authorization === 'Bearer banned-token') {
            return {
              user: {
                id: '2',
                name: 'Banned User',
                role: 'user',
                banned: true,
              },
              session: {},
            };
          }
          return null;
        }),
      },
      handler: () => {},
    },
  };
});

import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use((request: any, _response: any, next: any) => {
      if (request.headers.authorization?.trim() === 'Bearer mock-token') {
        request.user = {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        };
      }
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET) - Public', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/dashboard (GET) - Unauthorized without token', () => {
    return request(app.getHttpServer()).get('/dashboard').expect(401);
  });

  it('/dashboard (GET) - Authorized with user token', () => {
    return request(app.getHttpServer())
      .get('/dashboard')
      .set('Authorization', 'Bearer mock-token')
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toContain('Test User');
      });
  });

  it('/dashboard (GET) - Unauthorized for banned user token', () => {
    return request(app.getHttpServer())
      .get('/dashboard')
      .set('Authorization', 'Bearer banned-token')
      .expect(401);
  });
});
