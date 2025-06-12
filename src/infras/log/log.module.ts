/* eslint-disable no-console */
import { DomainException } from '@beincom/domain';
import { HEADER_VERSIONING, REQ_ID_HEADER } from '@commons/constants/app.const';
import { Global, Module } from '@nestjs/common/decorators';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { Logger, LoggerModule } from 'nestjs-pino';


@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ClsService],
      useFactory: (cls: ClsService<{ requestId: string }>) => {
        return {
          pinoHttp: {
            level: 'info',
            safe: true,
            autoLogging: {
              ignore(req) {
                return !req['originalUrl'].includes('/internal/');
              },
            },
            serializers: {
              req: (req: Request): any => ({
                method: req.method,
                url: req.url,
                query: req.query,
                params: req.params,
                body: req.body ?? req['raw']?.['body'],
                headers: {
                  [REQ_ID_HEADER]: req.headers[REQ_ID_HEADER] ?? cls?.getId(),
                  [HEADER_VERSIONING]: req.headers[HEADER_VERSIONING],
                },
              }),
              res: (res: Response): any => ({
                statusCode: res.statusCode,
              }),
              time: (time: number): any => ({
                timestamp: new Date(time).toISOString(),
              }),
            },
            timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
            errorKey: 'error',
            hooks: {
              logMethod(args, method, level) {
                const error = args[0]?.['err'] ?? args[0]?.['error'];
                const isError = level >= 50;
                const context = args[0]?.['context'] ?? '';
                const shouldWarnOnly =
                  context.includes('Kafka') || error instanceof DomainException;

                if (isError && shouldWarnOnly) {
                  method = this.warn;
                }

                method.apply(this, args);
              },
            },
            formatters: {
              level: (label: string): any => ({ level: label }),
              bindings: () => ({}),
              log: (object: any): any => {
                const {
                  res,
                  context,
                  responseTime,
                  error,
                  err,
                  msg,
                  req,
                  ...loggedObject
                } = object;
                const loggedError = error ?? err;
                const logFormat = {
                  res,
                  context,
                  msg: msg ?? loggedError?.message,
                  error: loggedError,
                  object: Array.isArray(object) ? object : loggedObject,
                  request_id: cls?.getId(),
                  response_time: responseTime,
                  req,
                };

                return logFormat;
              },
            },
          },
        };
      },
    }),
  ],
})
export class LogModule {}
