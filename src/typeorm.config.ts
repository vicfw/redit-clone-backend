import { DataSource } from 'typeorm';
import { Post } from './entities/Post';
import { User } from './entities/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'admin',
  database: 'reddit2',
  entities: [User, Post],
  synchronize: true,
  logging: true,
});
