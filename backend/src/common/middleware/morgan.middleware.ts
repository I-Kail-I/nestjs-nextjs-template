import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class MorganMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('HTTP');
  }

  // eslint-disable-next-line react/no-unnecessary-use-prefix
  use(req: Request, res: Response, next: NextFunction) {
    const morganFormat = ':method :url :status :response-time ms';

    morgan(morganFormat, {
      stream: {
        write: (message: string) => {
          this.logger.info(message.trim());
        },
      },
    })(req, res, next);
  }
}
