import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { createUserLoader } from './utils/createUserLoader';
import { createVoteStatusLoader } from './utils/createVoteStatusLoader';

export type MyContext = {
  req: Request;
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  updootLoader: ReturnType<typeof createVoteStatusLoader>;
};

declare module 'express-session' {
  export interface SessionData {
    userId: number;
  }
}
