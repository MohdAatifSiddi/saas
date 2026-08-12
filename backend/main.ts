import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

function requiredOrigin(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;
  const url = new URL(value);
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (
    process.env.NODE_ENV === 'production' &&
    (url.protocol !== 'https:' || isLocal)
  ) {
    throw new Error(`${name} must be a public HTTPS origin in production.`);
  }

  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(
      `${name} must be an origin without a path, query, or hash.`,
    );
  }

  return url.origin;
}

function parsePort(): number {
  const raw = process.env.PORT ?? '3001';
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  return port;
}

async function bootstrap() {
  const frontendOrigin = requiredOrigin(
    'FRONTEND_URL',
    'http://localhost:3000',
  );
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger:
      process.env.NODE_ENV === 'production'
        ? ['log', 'warn', 'error']
        : undefined,
  });

  app.enableShutdownHooks();
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    maxAge: 600,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      );
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false, value: false },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  await app.listen(parsePort(), '0.0.0.0');
}

bootstrap().catch(() => {
  process.exitCode = 1;
});
