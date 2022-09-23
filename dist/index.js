"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const connect_redis_1 = __importDefault(require("connect-redis"));
require("dotenv-safe/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const ioredis_1 = __importDefault(require("ioredis"));
require("reflect-metadata");
const type_graphql_1 = require("type-graphql");
const constants_1 = require("./constants");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const typeorm_config_1 = require("./typeorm.config");
const createUserLoader_1 = require("./utils/createUserLoader");
const createVoteStatusLoader_1 = require("./utils/createVoteStatusLoader");
const main = async () => {
    await typeorm_config_1.AppDataSource.initialize();
    const app = (0, express_1.default)();
    const redis = new ioredis_1.default(process.env.NODE_ENV === 'development'
        ? {}
        : {
            port: 15421,
            host: 'redis-15421.c244.us-east-1-2.ec2.cloud.redislabs.com',
            username: 'default',
            password: 'reddit',
            db: 0,
        });
    const RedisStore = (0, connect_redis_1.default)(express_session_1.default);
    app.use((0, cors_1.default)({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }));
    app.use((0, express_session_1.default)({
        store: new RedisStore({
            client: redis,
            disableTouch: true,
        }),
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        resave: false,
        name: constants_1.COOKIE_NAME,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 265 * 10,
            httpOnly: true,
            secure: constants_1.__prod__,
            sameSite: 'lax',
        },
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            userLoader: (0, createUserLoader_1.createUserLoader)(),
            updootLoader: (0, createVoteStatusLoader_1.createUpdootLoader)(),
        }),
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
main().catch((err) => { });
//# sourceMappingURL=index.js.map