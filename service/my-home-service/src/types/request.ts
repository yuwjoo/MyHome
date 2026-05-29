import { Request, Response } from 'express';
import { JwtPayload } from './jwt';

declare global {
  type NestJsRequest = Request & {
    user: JwtPayload;
  };

  type NestJsResponse = Response;
}
