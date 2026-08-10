/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

// Mock the @thallesp/nestjs-better-auth module to bypass ESM compilation and database dependencies during tests
jest.mock('@thallesp/nestjs-better-auth', () => {
  return {
    AuthModule: {
      forRoot: () => ({
        module: class MockAuthModule {},
        providers: [],
        exports: [],
      }),
    },
    Session: () => () => {},
    AllowAnonymous: () => () => {},
    OptionalAuth: () => () => {},
  };
});

// Mock the backend auth config to avoid importing better-auth and transitive ESM dependencies like @noble/hashes during testing
jest.mock('../src/auth', () => {
  return {
    auth: {
      api: {
        getSession: jest.fn().mockImplementation(async ({ headers }) => {
          if (headers.authorization === 'Bearer mock-token') {
            return {
              user: { id: '1', name: 'Test User', role: 'user' },
              session: {},
            };
          }
          if (headers.authorization === 'Bearer admin-token') {
            return {
              user: { id: '2', name: 'Admin User', role: 'admin' },
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

import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
});
