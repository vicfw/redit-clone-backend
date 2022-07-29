import { Request, Response } from 'express';
import { Redis } from 'ioredis';

export type MyContext = {
  req: Request;
  res: Response;
  redis: Redis;
};

declare module 'express-session' {
  export interface SessionData {
    userId: number;
  }
}
