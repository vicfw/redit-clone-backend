import { MikroORM } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up(); // run migration automatic

  //server
  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em }), //if we return something here its gonna accessible in resolver
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(3000, () => {
    console.log('server is running');
  });
};

main().catch((err) => {
  console.log(err);
});

//1:00:00 video timer
