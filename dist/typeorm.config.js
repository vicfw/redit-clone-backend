"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const path_1 = __importDefault(require("path"));
const typeorm_1 = require("typeorm");
const Post_1 = require("./entities/Post");
const Updoot_1 = require("./entities/Updoot");
const User_1 = require("./entities/User");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    entities: [User_1.User, Post_1.Post, Updoot_1.Updoot],
    migrations: [path_1.default.join(__dirname, './migrations/*')],
    logging: false,
    url: process.env.DATABASE_URL,
});
//# sourceMappingURL=typeorm.config.js.map