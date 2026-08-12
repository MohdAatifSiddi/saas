<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

This repository contains the SaaS Platform NestJS API and Better Auth integration. It uses PostgreSQL through Prisma, Resend for transactional email, and optional Google sign-in.

The application is designed as an authenticated API: the root route is public, while other routes are protected by the custom global authentication guard unless explicitly marked anonymous. Protected controllers must still enforce resource-level authorization and return allowlisted DTOs rather than raw Better Auth or Prisma records.

## Project setup

Use Node.js 22 or newer, pnpm, and PostgreSQL. The repository must contain a committed `pnpm-lock.yaml`; CI and Docker builds use `pnpm install --frozen-lockfile`.

```bash
pnpm install
pnpm prisma generate
cp .env.example .env
```

Never commit `.env` or any real credential. Use the deployment platform’s secret manager in production. `BETTER_AUTH_URL` must be the canonical authentication API URL, normally `https://api.example.com/api/auth`. `FRONTEND_URL` must be the exact browser origin without a path, query string, or fragment, and production origins must use HTTPS. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32` or stronger. Configure `RESEND_API_KEY` and `EMAIL_FROM` when email verification or password reset is enabled. Configure Google credentials together, or leave both empty to disable Google sign-in.

## Compile and run the project

```bash
pnpm run start:dev
pnpm run build
pnpm run start:prod
```

Run migrations as an explicit deployment step with `pnpm prisma migrate deploy`; application startup must not silently mutate the schema.

## Run tests and checks

```bash
pnpm run test
pnpm run test:e2e
pnpm run test:cov
pnpm run lint
pnpm run build
```

Before release, test expired, malformed, revoked, and banned sessions; password-reset expiry; email-enumeration behavior; OAuth callback validation; CORS preflight; oversized payloads; and unauthorized access to every protected route. Run a dependency audit and validate the production migration path against a disposable PostgreSQL database.

## Deployment

The production Dockerfile is a single-package multi-stage build. It installs from a frozen lockfile, generates Prisma Client, builds the application, runs as a non-root user, exposes a health check, and does not copy `.env` into the image.

```bash
docker build --pull -t saas-backend:latest .
docker run --rm -p 3001:3001 saas-backend:latest
```

Supply production secrets through encrypted runtime configuration rather than an image layer or a shared `.env` file. Verify that the reverse proxy terminates TLS, forwards only trusted proxy headers, and exposes only the required public API port. Configure centralized logs and metrics without recording passwords, reset tokens, session cookies, authorization headers, database URLs, provider keys, or complete personal records.

## Security references

- [NestJS security and Helmet](https://docs.nestjs.com/security/helmet)
- [NestJS CORS](https://docs.nestjs.com/security/cors)
- [NestJS validation](https://docs.nestjs.com/techniques/validation)
- [Better Auth NestJS integration](https://better-auth.com/docs/integrations/nestjs)
- [Better Auth security](https://better-auth.com/docs/reference/security)
- [Prisma PostgreSQL connector](https://www.prisma.io/docs/orm/core-concepts/supported-databases/postgresql)

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
