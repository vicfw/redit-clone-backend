import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import Redis from 'ioredis';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { COOKIE_NAME, __prod__ } from './constants';
import { Post } from './entities/Post';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { AppDataSource } from './typeorm.config';
import { MyContext } from './types';

const main = async () => {
  await AppDataSource.initialize();

  // await AppDataSource.runMigrations();

  //server
  const app = express();

  // await Post.delete({});

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );

  app.use(
    session({
      store: new RedisStore({
        client: redis as any,
        disableTouch: true,
      }),
      saveUninitialized: false,
      secret: 'asdszxczxasqweasd',
      resave: false,
      name: COOKIE_NAME,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 265 * 10, //10 years
        httpOnly: true,
        secure: __prod__, //only works in https
        sameSite: 'lax', //crsf
      },
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ req, res, redis }), //if we return something here its gonna accessible in resolver in @Ctx() decorator
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    console.log('server is running');
  });
};

main().catch((err) => {
  console.log(err);
});

//8:46:40 video timer i didnt push this time
