import { MikroORM } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import session from 'express-session';
import { createClient } from 'redis';
import connectRedis, { Client } from 'connect-redis';
import { COOKIE_NAME, __prod__ } from './constants';
import { MyContext } from './types';
import cors from 'cors';

// import session from 'express-session';

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up(); // run migration automatic

  //server
  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = createClient({ legacyMode: true });
  redisClient.connect().catch(console.error);

  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );

  app.use(
    session({
      store: new RedisStore({
        client: redisClient as any,
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
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }), //if we return something here its gonna accessible in resolver
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

//3:47:46 video timer
