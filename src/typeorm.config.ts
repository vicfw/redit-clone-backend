import path from "path";
import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { Updoot } from "./entities/Updoot";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "admin",
  database: "reddit2",
  entities: [User, Post, Updoot],
  synchronize: true,
  migrations: [path.join(__dirname, "./migrations/*")],
  logging: true,
});
