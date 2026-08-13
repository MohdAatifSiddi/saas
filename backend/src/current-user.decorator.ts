import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RequestWithAuth = {
  user?: unknown;
  session?: unknown;
};

function requestFrom(context: ExecutionContext): RequestWithAuth {
  return context.switchToHttp().getRequest<RequestWithAuth>();
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => requestFrom(context).user,
);

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => requestFrom(context).session,
);
