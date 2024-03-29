declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      REDIS_URL: string;
      PORT: string;
      SESSION_SECRET: string;
      NODE_ENV: string;
      CORS_ORIGIN: string;
    }
  }
}

export {}
