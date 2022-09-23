import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import 'dotenv-safe/config';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import Redis from 'ioredis';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { COOKIE_NAME, __prod__ } from './constants';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { AppDataSource } from './typeorm.config';
import { createUserLoader } from './utils/createUserLoader';
import { createUpdootLoader } from './utils/createVoteStatusLoader';

const main = async () => {
  await AppDataSource.initialize();

  // await AppDataSource.runMigrations();

  //server
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // await Post.delete({});

  const redis = new Redis(
    process.env.NODE_ENV === 'development'
      ? {}
      : {
          port: 15421, // Redis port
          host: 'redis-15421.c244.us-east-1-2.ec2.cloud.redislabs.com', // Redis host
          username: 'default', // needs Redis >= 6
          password: 'reddit',
          db: 0, // Defaults to 0
        }
  );

  const RedisStore = connectRedis(session);

  app.use(
    session({
      store: new RedisStore({
        client: redis as any,
        disableTouch: true,
      }),
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
      name: COOKIE_NAME,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 265 * 10, //10 years
        httpOnly: true,
        secure: __prod__, //only works in https
        sameSite: 'lax', //crsf
        domain: 'codeponder.com',
      },
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
    }), //if we return something here its gonna accessible in resolver in @Ctx() decorator
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(parseInt(process.env.PORT), () => {
    console.log('server connected');
  });
};

main().catch((err) => {});

//13:11:01 video timer
