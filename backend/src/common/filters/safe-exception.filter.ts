import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SafeExceptionFilter.name);

  catch(error: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();
    
    const status = error instanceof HttpException
      ? error.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error({
      requestId: request.id,
      status,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      // We deliberately exclude raw error messages, stack traces, and request payloads
      // to ensure secrets, PII, and document data are never leaked in logs.
    }, error instanceof Error ? error.stack : undefined);

    const safeMessage = error instanceof HttpException ? error.message : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message: status >= 500 ? 'Internal server error' : safeMessage,
      requestId: request.id,
    });
  }
}
