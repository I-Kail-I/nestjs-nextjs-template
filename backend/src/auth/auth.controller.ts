import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @All('*')
  async handler(@Req() req: Request, @Res() res: Response) {
    // Getting current url
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // Creating a new Request object
    const webRequest = new Request(url, {
      method: req.method,
      headers: new Headers(req.headers as Record<string, string>),
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    // Handling the request
    const response = await this.authService.auth.handler(webRequest);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send the response body
    const body = await response.text();
    try {
      res.json(JSON.parse(body));
    } catch {
      res.send(body);
    }
  }
}
