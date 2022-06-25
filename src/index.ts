import { MikroORM } from '@mikro-orm/core';
import { Post } from './entities/Post';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up(); // run migration automatic
  const post = orm.em.create(Post, { title: 'my 1st post' });
  await orm.em.persistAndFlush(post);
  //server
  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [''],
      validate: false,
    }),
  });

  app.listen(3000, () => {
    console.log('server is running');
  });
};

main().catch((err) => {
  console.log(err);
});

//37:30 video timer
